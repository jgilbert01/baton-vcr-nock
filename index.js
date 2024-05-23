const nock = require('nock');
const fs = require('fs');
const path = require('path');
const { cloneDeepWith } = require('lodash');

const REGEX = 'regex:'

const prepareBodyRegex = (def) => {
    if (!def.body) return;

    if (typeof def.body === 'string') {
        if (def.body.startsWith(REGEX)) {
            def.body = new RegExp(def.body.substring(REGEX.length));
        }
    } else {
        def.body = cloneDeepWith(def.body, (value) => {
            if (value && typeof value === 'string' && value.startsWith(REGEX)) {
                return new RegExp(value.substring(REGEX.length));
            } else {
                return undefined;
            }
        });
    }
};

const vcr = ({ mode, fixtures, fixtureName, prepareScope, opt }) => {
    nock.restore();
    nock.recorder.clear();
    nock.cleanAll();
    nock.activate();

    const ctx = {
        mode: mode || process.env.REPLAY || 'replay',
        opt: opt || {},
        fixtures: path.resolve(fixtures || './fixtures'),
        fixtureName: undefined,
        fixture: undefined,
        files: [],
        defs: undefined,
        nocks: undefined,
        prepareScope: [prepareBodyRegex, ...(prepareScope || [])],
    };

    if (fixtureName) {
        ctx.fixture = path.join(ctx.fixtures, `${fixtureName}.json`);
        if (fs.existsSync(ctx.fixture)) {
            ctx.files = [`${fixtureName}.json`];
        }
    } else {
        if (fs.existsSync(ctx.fixtures)) {
            ctx.files = fs.readdirSync(ctx.fixtures);
        }
    }
    ctx.defs = ctx.files.reduce((a, fixture) => [...a, ...nock.loadDefs(path.join(ctx.fixtures, fixture))], []);
    ctx.prepareScope.forEach((f) => ctx.defs.forEach((def) => f(def)));
    ctx.nocks = nock.define(ctx.defs);

    console.log(`Replay mode = ${ctx.mode}`);

    if (ctx.mode === 'record') {
        ctx.fixtureName = fixtureName || Date.now();
        ctx.fixture = path.join(ctx.fixtures, `${ctx.fixtureName}.json`);

        nock.recorder.rec({
            output_objects: true,
            logging: (content) => {
                console.log('content: ', content);
                fs.mkdirSync(path.dirname(ctx.fixture), { recursive: true });
                console.log('outputs: ', JSON.stringify(nock.recorder.play(), null, 2));
                fs.writeFileSync(ctx.fixture, JSON.stringify(nock.recorder.play(), null, 2));
            },
            ...ctx.opt,
        });
    } else if (ctx.mode === 'replay') {
        nock.disableNetConnect();
    } else {
        // mode is wild
    }

    return ctx;
};

const requestRelay = () => 'TODO';
const eventRelay = () => 'TODO';

module.exports = {
    vcr,
    requestRelay,
    eventRelay,
};
