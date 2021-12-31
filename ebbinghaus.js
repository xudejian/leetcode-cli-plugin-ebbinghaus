var moment = require('moment');
var _ = require('underscore');

var log = require('../log');
var Plugin = require('../plugin');
var session = require('../session');
var h = require('../helper');
const list_aliases = require('../commands/list').aliases;
const show_aliases = require('../commands/show').aliases;

var plugin = new Plugin(300, 'ebbinghaus', '2021.12.30',
    'Plugin to show problem in ebbinhaus order.');

function getEbbinghausDay(ymd) {
	const d = moment().diff(moment(ymd, 'YYYY-MM-DD'), 'days');
	const ebbinghaus_days = [180, 90, 30, 15, 7, 4, 2, 1];
	for (let diff of ebbinghaus_days) {
		if (d >= diff) {
			return diff;
		}
	}
	return 0;
}

function getProblems(needTranslation, cb) {
  plugin.next.getProblems(needTranslation, function(e, problems) {
    if (e) return cb(e);

		const ebbinghaus = {};
		const stats = require('../cache').get(h.KEYS.stat) || {};
		for (let k of _.keys(stats)) {
			const d = getEbbinghausDay(k);
			(stats[k]['ac.set']||[]).forEach(function(id) {
				if (id in ebbinghaus) {
					ebbinghaus[id] = Math.min(ebbinghaus[id], d);
				} else {
					ebbinghaus[id] = d;
				}
			});
		}

		problems = problems.filter(function(x) {
			if ((ebbinghaus[x.fid]||0) > 0) {
				x.tags = (x.tags || []).concat(['days-' + ebbinghaus[x.fid]]);
				x.state = 'review';
				return true;
			}
			return false;
		});
		console.log('list in ebbinghaus');
    return cb(null, problems);
  });
}

function pickProblem(needTranslation, cb) {
  plugin.next.getProblems(needTranslation, function(e, problems) {
    if (e) return cb(e);

		const ebbinghaus = {};
		const stats = require('../cache').get(h.KEYS.stat) || {};
		for (let k of _.keys(stats)) {
			const d = getEbbinghausDay(k);
			(stats[k]['ac.set']||[]).forEach(function(id) {
				if (id in ebbinghaus) {
					ebbinghaus[id] = Math.min(ebbinghaus[id], d);
				} else {
					ebbinghaus[id] = d;
				}
			});
		}
		const ebbinghaus_list = {};
		let max_days = 0;
		for (let id of _.keys(ebbinghaus)) {
			ebbinghaus_list[ebbinghaus[id]] = ebbinghaus_list[ebbinghaus[id]] || {};
			ebbinghaus_list[ebbinghaus[id]][id] = true;
			max_days = Math.max(max_days, ebbinghaus[id]);
		}

		problems = problems.filter(function(x) {
			if (x.fid in ebbinghaus_list[max_days]) {
				x.state = 'review';
				return true;
			}
			return false;
		});
		const problem = _.sample(problems);
		console.log('pick in ebbinghaus');
    return cb(null, [problem]);
  });
}

const aliases = {'list':getProblems, 'show':pickProblem};
for (let a of list_aliases) {
	aliases[a] = getProblems;
}
for (let a of show_aliases) {
	aliases[a] = pickProblem;
}

plugin.getProblems = function (needTranslation, cb) {
	if (_.isArray(session.argv._) && session.argv.ebbinghaus) {
		const cmd = session.argv._[0]||'';
		return (aliases[cmd] || plugin.next.getProblems)(needTranslation, cb);
	}

	return plugin.next.getProblems(needTranslation, cb);
};

module.exports = plugin;
