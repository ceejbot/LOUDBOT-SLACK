var
    SLACKBOT = require('./SLACKBOT.js'),
    RESTIFY  = require('restify')
    ;

var TOKENS;
if (process.env.TOKENS)
{
    TOKENS = process.env.TOKENS.split(',');
}

var LOUDBOT = new SLACKBOT();
var SERVER = RESTIFY.createServer();

SERVER.use(RESTIFY.acceptParser(SERVER.acceptable));
SERVER.use(RESTIFY.queryParser());
SERVER.use(RESTIFY.gzipResponse());
SERVER.use(RESTIFY.bodyParser({ mapParams: false }));

SERVER.get('/PING', PING);
SERVER.get('/LOUDS', LOUDS);
SERVER.post('/MESSAGE', MESSAGE);
SERVER.listen(process.env.PORT || 4444);

function PING(REQUEST, RESPONSE, NEXT)
{
    RESPONSE.send(200, 'PONG');
    NEXT();
}

function LOUDS(REQUEST, RESPONSE, NEXT)
{
    RESPONSE.send(LOUDBOT.THELOUDS());
    NEXT();
}

function MESSAGE(REQUEST, RESPONSE, NEXT)
{
    if (TOKENS)
    {
        var IDX = TOKENS.indexOf(REQUEST.body.token);
        if (IDX === -1) return NEXT(new RESTIFY.ForbiddenError('NO LOUDS FOR YOU'));
    }

    var WHAT;
    if (REQUEST.body.user_name !== 'slackbot')
        WHAT = LOUDBOT.LISTENUP(REQUEST.body);

    if (WHAT)
        RESPONSE.json(200, { text: WHAT, channel: REQUEST.body.channel_name });
    else
        RESPONSE.send(200);

    NEXT();
}
