var _ = require('underscore');
var request = require('request');

var leetcode = require('./leetcode');
var cache = require('../cache');
var config = require('../config');
var log = require('../log');
var Plugin = require('../plugin');
var session = require('../session');

var plugin = new Plugin(300, 'tag', '2022.03.18',
    'Plugin to show problem which has tag.');

function getProblems(needTranslation, cb) {
	plugin.next.getProblems(needTranslation, function(e, problems) {
		if (_.isArray(session.argv.tag) && session.argv.tag.length > 0) {
			getProblemsWithTag(session.argv.tag[0], function(e, tagProblems) {
				const tags = {};
				for (let p of tagProblems) {
					tags[p.fid] = p.tags;
				}
				problems.forEach(function(problem) {
					var id = String(problem.fid);
					if (id in tags) {
						problem.tags = (problem.tags || []).concat(tags[id]);
					}
				});
				cb(null, problems);
			});
		} else {
			cb(e, problems);
		}
	});
}

function getProblemsWithTag(tag, cb) {
	tag = tag.toLowerCase().replaceAll('/', '-').replaceAll(' ', '-');
	const tagCacheKey = 'tag.'+tag;
  const problems = cache.get(tagCacheKey);
  if (problems) {
    log.debug('cache hit: '+tagCacheKey+'.json');
    return cb(null, problems);
  }

  const opts = leetcode.makeOpts(config.sys.urls.graphql);
  opts.headers.Origin = config.sys.urls.base;
  opts.headers.Referer = config.sys.urls.base + '/tag/' + tag + '/';

  opts.json = true;
  opts.body = {
    query: [
			'query getTopicTag($slug: String!) {',
			'  topicTag(slug: $slug) {',
			'    name',
			'    slug',
			'    questions {',
			'      status',
			'      questionId',
			'      questionFrontendId',
			'      title',
			'      titleSlug',
			'      stats',
			'      difficulty',
			'      isPaidOnly',
			'      topicTags {',
			'        name',
			'        slug',
			'        __typename',
			'      }',
			'      companyTags {',
			'        name',
			'        slug',
			'        __typename',
			'      }',
			'      __typename',
			'    }',
			'    frequencies',
			'    __typename',
			'  }',
			'}',
    ].join('\n'),
    variables:     {slug: tag},
    operationName: 'getTopicTag'
  };

  request(opts, function(e, resp, body) {
    e = leetcode.checkError(e, resp, 200);
    if (e) return cb(e);

    const q = body.data.topicTag.questions;
    if (!q) return cb('failed to load problem!');

    const problems = q
        .map(function(p) {
          return {
            state:    p.status || 'None',
            id:       p.questionId,
            fid:      p.questionFrontendId,
            name:     p.title,
            slug:     p.titleSlug,
            link:     config.sys.urls.problem.replace('$slug', p.titleSlug),
            locked:   p.isPaidOnly,
            percent:  JSON.parse(p.stats).acRate,
            level:    p.difficulty,
						starred:  false,
						tags:     _.map(p.topicTags, function(t) {return t.slug;}),
          };
        });

    cache.set(tagCacheKey, problems);
    return cb(null, problems);
  });
}

plugin.getProblems = getProblems;

module.exports = plugin;
