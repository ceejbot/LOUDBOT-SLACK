var
	BORING_EMOJI = require('emoji-list'),
	FS = require('fs'),
	MARKOV = require('markoff'),
	MARK = new MARKOV(),
	SLACK = require('@slack/client'),
	SLACK_EVENTS = SLACK.CLIENT_EVENTS.RTM,
	RTM_EVENTS = SLACK.RTM_EVENTS,
	LOG = console.log
	;

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

	THIS.WEB = new SLACK.WebClient(process.env.SLACK_API_TOKEN);
	THIS.RTM = new SLACK.RtmClient(process.env.SLACK_API_TOKEN, {logLevel: 'warn'});
	THIS.RTM.on(RTM_EVENTS.MESSAGE, function(DATA) { THIS.LISTENUP(DATA); });
};

LOUDBOT.prototype.GOGOGO = function GOGOGO()
{
	var THIS = this;

	THIS.RTM.start();
	THIS.RTM.on(SLACK_EVENTS.RTM_CONNECTION_OPENED, function slackClientOpened()
	{
		LOG('LOUDBOT IS NOW OPERATIONAL');
	});
};

LOUDBOT.prototype.LISTENUP = function LISTENUP(DATA)
{
	if (!DATA.text) return;
	if (DATA.subtype === 'bot_message') return;
	var THIS = this;

	if (ISLOUD(DATA.text))
	{
		THIS.REMEMBER(DATA.text);
		THIS.YELL(DATA.channel);
		return;
	}

	THIS.DOEMOJI(DATA);
};

var CUSTOM_EMOJI = [
    // YOUR CUSTOM EMOJI HERE
];

var EMOJI = [];
for (var I = 0; I < BORING_EMOJI.length; I++)
	EMOJI.push(BORING_EMOJI[I].replace(/:(\w+):/g, '$1'));
EMOJI = EMOJI.concat(CUSTOM_EMOJI);

// LOUDBOT LIKES CUSTOM EMOJI AND ALSO OLD-SCHOOL FOR LOOPS
var EMOJI_PATTERNS = [];
for (I = 0; I < CUSTOM_EMOJI.length; I++)
	EMOJI_PATTERNS.push(new RegExp('(^|\W)' + CUSTOM_EMOJI[I] + '(\W|$)'));

LOUDBOT.prototype.CHOOSE_EMOJI = function CHOOSE_EMOJI(MSG)
{
	for (var I = 0; I < EMOJI_PATTERNS.length; I++)
	{
		if (MSG.match(EMOJI_PATTERNS[I]) && (Math.floor(Math.random() * 100) < 10))
			return CUSTOM_EMOJI[I];
	}

	if (MSG.match(/(\?|!)/) && (Math.floor(Math.random() * 100) < 2))
		return EMOJI[Math.floor(Math.random() * EMOJI.length)];
};

LOUDBOT.prototype.DOEMOJI = function DOEMOJI(DATA)
{
	// SOMETIMES LOUDBOT USES EMOJI
	var THIS = this;

	var EMO = THIS.CHOOSE_EMOJI(DATA.text);
	if (!EMO)
		return;

	var OPTS = {
		name: EMO,
		channel: DATA.channel_id,
		timestamp: DATA.timestamp
	};
	THIS.WEB.reactions.add(OPTS, function(ERROR, RESPONSE)
	{
		if (ERROR) console.log(ERROR);
	});
};

LOUDBOT.prototype.HANDLE_SPECIALS = function HANDLE_SPECIALS(DATA)
{
	var THIS = this;
	var MSG = DATA.text;
	if (!MSG) return;
	if (MSG.match(/CLOWN\s*SHOES/i))
	{
		THIS.RTM.sendMessage('https://i.cloudup.com/MhNp5cf7Fz.gif', DATA.channel);
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

LOUDBOT.prototype.YELL = function YELL(CHANNEL)
{
	var THIS = this;

	var ROLL_THE_DICE = Math.floor(Math.random() * 100);
	if (ROLL_THE_DICE >= 95)
		return THIS.RTM.sendMessage(MARK.generatePhrase(10, 20), CHANNEL);

	var LEN = THIS.LOUDS.length;
	var L = Math.floor(Math.random() * LEN);
	var LOUD = THIS.LOUDS[L];
	THIS.RTM.sendMessage(LOUD, CHANNEL);
};

LOUDBOT.prototype.THELOUDS = function THELOUDS()
{
	return this.LOUDS;
};
