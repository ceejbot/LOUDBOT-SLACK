var FS = require('fs');
var MARKOV = require('markoff');
var MARK = new MARKOV();
var API = require('slack-api');

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

    THIS.LOUDS.forEach(function(LOUD)
    {
        MARK.addTokens(LOUD.split(/\s+/g));
    });
};

LOUDBOT.prototype.LISTENUP = function LISTENUP(DATA)
{
    var MSG = DATA.text;
    var THIS = this;
    var SPECIAL = THIS.ISSPECIAL(MSG);

    if (SPECIAL) return SPECIAL;
    if (ISLOUD(MSG))
    {
        THIS.REMEMBER(MSG);
        return THIS.YELL();
    }

    return THIS.DOEMOJI(DATA);
};

var EMOJI = [
    'shipit',
    'sheep',
    'smiley_cat',
    'smile_cat',
    'heart_eyes_cat',
    'kissing_cat',
    'smirk_cat',
    'scream_cat',
    'crying_cat_face',
    'joy_cat',
    'pouting_cat',
    'cat',
    'cat2', 'thumbsup', 'thumbsdown', 'facepunch',
    'sparkles',
];

LOUDBOT.prototype.DOEMOJI = function DOEMOJI(DATA)
{
    // SOMETIMES LOUDBOT USES EMOJI
    if (!process.env.SLACK_TOKEN)
        return;

    if (!DATA.text.match(/(\?|!)/) || (Math.floor(Math.random() * 100) < 75))
        return;

    var M = Math.floor(Math.random() * EMOJI.length);
    var OPTS =
    {
        token: process.env.SLACK_TOKEN,
        name: EMOJI[M],
        channel: DATA.channel_id,
        timestamp: DATA.timestamp
    };
    API.reactions.add(OPTS, function(ERROR, RESPONSE)
    {
        if (ERROR) console.log(ERROR);
    });
};

var BANANAS = [
    'http://media.fi.gosupermodel.com/displaypicture?imageid=4981105&large=1',
    'http://minionslovebananas.com/images/gallery/preview/Chiquita-DM2-minion-banana-1.jpg',
    'http://minionslovebananas.com/images/gallery/preview/Chiquita-DM2-minion-banana-3.jpg',
    'http://minionslovebananas.com/images/gallery/preview/Chiquita-DM2-minion-dave-bananas.jpg',
    'http://minionslovebananas.com/images/gallery/preview/Chiquita-DM2-gallery_phil_eating_banana.jpg',
    'http://minionslovebananas.com/images/right-side/fruit_head_minion.jpg',
    'http://media-cache-ec0.pinimg.com/236x/c8/61/7b/c8617bc383dcbe035c77e22946439475.jpg',
];

LOUDBOT.prototype.ISSPECIAL = function ISSPECIAL(MSG)
{
    if (!MSG) return;

    if (MSG.toUpperCase().match(/BANANA/))
    {
        var M = Math.floor(Math.random() * BANANAS.length);
        return BANANAS[M];
    }

    if (MSG.toUpperCase().match(/CLOWN\s*SHOES/))
    {
        return 'https://i.cloudup.com/MhNp5cf7Fz.gif';
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

    var ROLL_THE_DICE = Math.floor(Math.random() * 100);
    if (ROLL_THE_DICE >= 95)
        return MARK.generatePhrase(4, 20);

    var LEN = THIS.LOUDS.length;
    var L = Math.floor(Math.random() * LEN);
    var LOUD = THIS.LASTLOUD = THIS.LOUDS[L];
    return LOUD;
};

LOUDBOT.prototype.THELOUDS = function THELOUDS()
{
    return this.LOUDS;
};
