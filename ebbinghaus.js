var moment = require('moment');
var _ = require('underscore');

var cache = require('../cache');
var core = require('../core');
var chalk = require('../chalk');
var icon = require('../icon');
var log = require('../log');
var Plugin = require('../plugin');
var session = require('../session');
var sprintf = require('../sprintf');
var h = require('../helper');
const stat_aliases = require('../commands/stat').aliases;
const show_aliases = require('../commands/show').aliases;
const show_handler = require('../commands/show').handler;

var plugin = new Plugin(300, 'ebbinghaus', '2021.12.30',
    'Plugin to show problem in ebbinhaus order.');

function getEbbinghaus() {
	const ac = {};
	const stats = cache.get(h.KEYS.stat) || {};
	for (let k of _.keys(stats)) {
		const d = moment().diff(moment(k, 'YYYY-MM-DD'), 'days');
		(stats[k]['ac.set']||[]).forEach(function(id) {
			ac[id] = ac[id] || new Set();
			ac[id].add(d);
		});
	}

	const ebbinghaus = {};
	for (let id of _.keys(ac)) {
		if (ac[id].has(0)) {
			continue;
		}
		const days = Array.from(ac[id]).sort(function(a, b) { return a - b; });
		const task_days            = [1, 2, 4, 7, 15, 30, 90, 180];
		const next_task_after_days = [1, 1, 2, 3,  8, 15, 60, 90];
		let i = days.length-1;
		let j = i-1;
		let k = 0;
		log.debug('['+id+'] review: ' + JSON.stringify(days));
		while (i > 0 && j>=0) {
			const d = days[i] - days[j];
			if (d < next_task_after_days[k]) {
				log.debug('[' + id +'] review early: ' + d + ' expect: ' + next_task_after_days[k]);
				j--;
			} else if (d == next_task_after_days[k] || d-1 == next_task_after_days[k]) {
				log.debug('[' + id +'] review expect: '+d+'/'+next_task_after_days[k]+' in task day ' + task_days[k]);
				k++;
				i = j;
				if (k>= next_task_after_days.length) {
					i--;
					k = 0;
				}
				j = i-1;
			} else {
				log.debug('[' + id +'] review later: '+d+'/'+next_task_after_days[k]+' ['+i+'/'+j+']');
				i--;
				j = i-1;
			}
		}
		if (i<0) {
			log.debug('[' + id +'] complete full cycle');
			continue;
		}
		log.debug('[' + id +'] previous day: ' + days[i] + '/' + next_task_after_days[k]);
		if (days[i] >= next_task_after_days[k]) {
			ebbinghaus[id] = task_days[k];
		}
	}
	return ebbinghaus;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function rebuildStat(problems) {
	const stats = cache.get(h.KEYS.stat) || {};

	for (let p of problems) {
		if (p.state === 'ac') {
			await sleep(1000);
			core.getSubmissions(p, function(e, submissions) {
				if (e) return;
				for (let subm of submissions) {
					if (subm.status_display === 'Accepted') {
						const day = moment.unix(subm.timestamp).format('YYYY-MM-DD');
						const stat = stats[day] = stats[day] || {};
						const k = 'ac.set';
						const s = new Set(stat[k] || []);
						s.add(p.fid);
						stat[k] = Array.from(s);
						stat['ac'] = s.size;
						log.debug(day + ' ' + p.fid);
					}
				}
			});
		}
	}

	cache.set(h.KEYS.stat, stats);
}

function statProblems(needTranslation, cb) {
  plugin.next.getProblems(needTranslation, function(e, problems) {
		if (!('ebbinghaus' in session.argv)) {
			return cb(e, problems);
		}
    if (e) return cb(e);

		if ('rebuild' in session.argv) {
			rebuildStat(problems);
		}
		const ac = {};
		const stats = require('../cache').get(h.KEYS.stat) || {};
		for (let k of _.keys(stats)) {
			const d = moment().diff(moment(k, 'YYYY-MM-DD'), 'days');
			(stats[k]['ac.set']||[]).forEach(function(id) {
				ac[id] = ac[id] || {};
				ac[id][d] = true;
			});
		}
		showGraph(ac);
  });
}

function showGraph(problems) {
  const ICONS = {
    ac:    chalk.green(icon.ac),
    yes: chalk.red(icon.yes),
    none:  chalk.gray(icon.none),
    next:  chalk.gray(icon.yes),
    empty: icon.empty
  };

	for (const [key, value] of Object.entries(problems)) {
		let line = new Array(95).fill(ICONS.none);
		let fid = sprintf(' %04s', key);
		for (let i=0; i<fid.length; i++) {
			line[i] = fid[i];
		}
		for (let d of Object.keys(value)) {
			if (d <= 90) {
				line[94-d] = ICONS.ac;
			}
		}
		if (line[94]==ICONS.ac) {
			line[94] = ICONS.yes;
		}
    log.info(line.join(''));
	}
  log.info();
}

function pickProblem(needTranslation, cb) {
	if (!session.argv.keyword) {
		const ebbinghaus = getEbbinghaus();
		const ebbinghaus_list = {};
		let max_days = 0;
		for (let id of _.keys(ebbinghaus)) {
			ebbinghaus_list[ebbinghaus[id]] = ebbinghaus_list[ebbinghaus[id]] || {};
			ebbinghaus_list[ebbinghaus[id]][id] = true;
			max_days = Math.max(max_days, ebbinghaus[id]);
		}
		const fids = _.keys(ebbinghaus_list[max_days]);
		if (fids.length > 0) {
			session.argv.keyword = fids[0];
			log.info('review ' +fids[0] + ' task:' + max_days);
			return show_handler(session.argv);
		}
	}

	return plugin.next.getProblems(needTranslation, cb);
}

const aliases = {
	'stat':statProblems,
	'show':pickProblem,
};

for (let a of stat_aliases) {
	aliases[a] = statProblems;
}
for (let a of show_aliases) {
	aliases[a] = pickProblem;
}

plugin.getProblems = function (needTranslation, cb) {
	if (_.isArray(session.argv._)) {
		const cmd = session.argv._[0]||'';
		return (aliases[cmd] || plugin.next.getProblems)(needTranslation, cb);
	}

	return plugin.next.getProblems(needTranslation, cb);
};

module.exports = plugin;
