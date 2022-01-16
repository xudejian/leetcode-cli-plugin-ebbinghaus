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

function getEbbinghaus() {
	const ac = {};
	const stats = require('../cache').get(h.KEYS.stat) || {};
	for (let k of _.keys(stats)) {
		const d = moment().diff(moment(k, 'YYYY-MM-DD'), 'days');
		(stats[k]['ac.set']||[]).forEach(function(id) {
			ac[id] = ac[id] || {};
			ac[id][d] = true;
		});
	}

	const ebbinghaus = {};
	for (let id of _.keys(ac)) {
		if (ac[id][0]||false) {
			continue;
		}
		const days = _.keys(ac[id]).sort();
		const task_days            = [1, 2, 4, 7, 15, 30, 90, 180];
		const next_task_after_days = [1, 1, 2, 3,  8, 15, 60, 90];
		let i = days.length-1;
		let j = i-1;
		let k = 0;
		while (i > 0 && j>=0) {
			const d = days[i] - days[j];
			if (d < next_task_after_days[k]) {
				log.debug('review early than expect: ' + id);
				j--;
			} else if (d == next_task_after_days[k]) {
				log.debug('review as expect: ' + id + ' in days ' + task_days[k]);
				k++;
				i = j;
				if (k>= next_task_after_days.length) {
					i--;
					k = 0;
				}
				j = i-1;
			} else {
				log.debug('review later than expect: ' + id + ' in days ' + task_days[k]);
				i--;
			}
		}
		if (i<0) {
			log.debug('complete full cycle: ' + id);
			continue;
		}
		log.debug('previous day:' + i + days[i] + ' expect wait ' + k + ' cur ' + j);
		if (days[i] >= next_task_after_days[k]) {
			ebbinghaus[id] = task_days[k];
		}
	}
	return ebbinghaus;
}

function getProblems(needTranslation, cb) {
  plugin.next.getProblems(needTranslation, function(e, problems) {
    if (e) return cb(e);

		const ebbinghaus = getEbbinghaus();
		problems = problems.filter(function(x) {
			if ((ebbinghaus[x.fid]||0) > 0) {
				x.tags = (x.tags || []).concat(['days-' + ebbinghaus[x.fid]]);
				x.state = 'review';
				return true;
			}
			return false;
		});
		log.debug('list in ebbinghaus');
    return cb(null, problems);
  });
}

function pickProblem(needTranslation, cb) {
  plugin.next.getProblems(needTranslation, function(e, problems) {
    if (e) return cb(e);

		const ebbinghaus = getEbbinghaus();
		const ebbinghaus_list = {};
		let max_days = 0;
		for (let id of _.keys(ebbinghaus)) {
			ebbinghaus_list[ebbinghaus[id]] = ebbinghaus_list[ebbinghaus[id]] || {};
			ebbinghaus_list[ebbinghaus[id]][id] = true;
			max_days = Math.max(max_days, ebbinghaus[id]);
		}

		let _problems = problems.filter(function(x) {
			if (x.fid in (ebbinghaus_list[max_days]||{})) {
				x.state = 'review';
				return true;
			}
			return false;
		});
		if (_problems.length == 0) {
			_problems = problems;
			log.info('ebbinghaus list is empty');
		}
		const problem = _.sample(_problems);
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
