var FS = require('fs');

function ISLOUD(MSG)
{
    return MSG !== MSG.toLowerCase() && MSG === MSG.toUpperCase();
}

var STARTERFILE = __dirname + '/STARTERS';
var STARTERS = FS.readFileSync(STARTERFILE, 'UTF8');
STARTERS = STARTERS.trim().split(/\n/);

var SAVEFILE = __dirname + '/LOUDS';
var SAVING = false;
var WAITING = [];

var LOUDBOT = module.exports = function LOUDBOT()
{
    if (!(this instanceof LOUDBOT))
        return new LOUDBOT();

    var THIS = this;

    try
    {
        THIS.LOUDS = FS.readFileSync(SAVEFILE, 'UTF8').trim().split('\n');
    }
    catch (ERRRRROR)
    {
        THIS.LOUDS = [];
    }

    THIS.LOUDS = THIS.LOUDS.concat(STARTERS);
};

LOUDBOT.prototype.LISTENUP = function LISTENUP(MSG)
{
    var THIS = this;

    if (ISLOUD(MSG))
    {
        THIS.REMEMBER(MSG);
        return THIS.YELL();
    }
};

LOUDBOT.prototype.REMEMBER = function REMEMBER(LOUD)
{
    this.LOUDS.push(LOUD);

    WAITING.push(LOUD);
    if (SAVING) return;

    SAVING = true;
    FS.appendFile(SAVEFILE, WAITING.join('\n') + '\n', 'UTF8', function()
    {
        SAVING = false;
    });
    WAITING.length = 0;
};

LOUDBOT.prototype.YELL = function YELL()
{
    var THIS = this;

    var LEN = THIS.LOUDS.length;
    var L = Math.floor(Math.random() * LEN)
    var LOUD = THIS.LASTLOUD = THIS.LOUDS[L];
    return LOUD;
};

LOUDBOT.prototype.THELOUDS = function THELOUDS()
{
    return this.LOUDS;
};
