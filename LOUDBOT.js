#!/usr/bin/env node

const
	DEMAND       = require,
	BORING_EMOJI = DEMAND('emoji-list'),
	FLIP         = DEMAND('flip'),
	FS           = DEMAND('fs'),
	LRU          = DEMAND('lru-cache'),
	MARKOV       = DEMAND('markov-chains-text').default,
	SHUFFLE      = DEMAND('knuth-shuffle').knuthShuffle,
	SLACK        = DEMAND('@slack/client'),
	SLACK_EVENTS = SLACK.CLIENT_EVENTS.RTM,
	RTM_EVENTS   = SLACK.RTM_EVENTS,
	LOG          = console.log
	;

function ISLOUD(MSG)
{
	return MSG !== MSG.toLowerCase() && MSG === MSG.toUpperCase();
}

function ROLL_D100(CHANCE)
{
	return Math.floor(Math.random() * 100) < CHANCE;
}

var SAVEFILE = __dirname + '/LOUDS';
var SAVING = false;
var WAITING = [];
var EMOJI = [];
var EMOJI_PATTERNS = [];

var LOUDBOT = module.exports = function LOUDBOT()
{
	if (!(this instanceof LOUDBOT))
		return new LOUDBOT();

	const THIS = this;
	THIS.LOUDS = [];
	THIS.LOAD_ALL_LOUDS();
	THIS.COUNT = 0;

	THIS.CACHE = LRU({ max: 2000, });

	THIS.WEB = new SLACK.WebClient(process.env.SLACK_TOKEN);
	THIS.LOAD_EMOJI();
	THIS.RTM = new SLACK.RtmClient(process.env.SLACK_TOKEN, {logLevel: 'warn'});
	THIS.RTM.on(RTM_EVENTS.MESSAGE, function(DATA) { THIS.LISTENUP(DATA); });
	THIS.RTM.on('error', function(INFRACTION) { LOG(INFRACTION); });
};

LOUDBOT.prototype.LOAD_EMOJI = function LOAD_EMOJI()
{
	const THIS = this;

	for (var I = 0; I < BORING_EMOJI.length; I++)
		EMOJI.push(BORING_EMOJI[I].replace(/:(\w+):/g, '$1'));

	THIS.WEB.emoji.list(function(INFRACTION, INCONVENIENT_RESPONSE)
	{
		if (INFRACTION) return LOG(JSON.stringify(INFRACTION));
		EMOJI = EMOJI.concat(Object.keys(INCONVENIENT_RESPONSE.emoji)).sort();
		// LOUDBOT LIKES EMOJI AND ALSO OLD-SCHOOL FOR LOOPS
		for (I = 0; I < EMOJI.length; I++)
			EMOJI_PATTERNS.push(new RegExp('(^|\W)' + EMOJI[I] + '(\W|$)'));

		LOG(`WHOA I KNOW ${EMOJI.length} EMOJI`);
	});
};

LOUDBOT.prototype.LOAD_ALL_LOUDS = function LOAD_ALL_LOUDS()
{
	const THIS = this;

	THIS.ADD_LINES(SAVEFILE);
	THIS.ADD_LINES(__dirname + '/STARTERS');
	THIS.MARKOV = new MARKOV(THIS.LOUDS.join('\n'));
	SHUFFLE(THIS.LOUDS);
	LOG(`THERE ARE ${THIS.LOUDS.length} LOUDS TO SHOUT!`);
};

LOUDBOT.prototype.ADD_LINES = function ADD_LINES(FILENAME)
{
	var THIS = this, LINES = [];
	try { LINES = FS.readFileSync(FILENAME, 'UTF8').trim().split('\n'); }
	catch (IGNORED) {}

	THIS.LOUDS = THIS.LOUDS.concat(LINES);
};

LOUDBOT.prototype.GOGOGO = function GOGOGO()
{
	const THIS = this;

	THIS.RTM.start();
	THIS.RTM.on(SLACK_EVENTS.RTM_CONNECTION_OPENED, function slackClientOpened()
	{
		LOG('THIS LOUDBOT IS NOW FULLY ARMED AND OPERATIONAL');
		THIS.RTM.sendMessage('THIS LOUDBOT IS NOW FULLY ARMED AND OPERATIONAL', 'C026HPPTR');
	});
};

const RECENT = 1000 * 60 * 5;

LOUDBOT.prototype.LISTENUP = function LISTENUP(DATA)
{
	const THIS = this;
	if (!DATA.text || DATA.user === 'U07FD4NH1' || DATA.subtype === 'bot_message') return;
	if (THIS.CACHE.get(DATA.ts)) { LOG('SKIPPING SEEN MESSAGE'); return; }
	if (DATA.ts * 1000 < Date.now() - RECENT) { return; }

	THIS.CACHE.set(DATA.ts, DATA);

	if (THIS.HANDLE_SPECIALS(DATA))
		return;

	if (THIS.FUCK_SOMETHING_UP(DATA))
		return;

	if (THIS.TAKE_OFF_ZIG(DATA))
		return;

	if (THIS.REPORT(DATA))
		return;

	if (THIS.CAFFEINATE(DATA))
		return;

	if (THIS.REBEL_YELL(DATA))
		return;

	THIS.DOEMOJI(DATA);
};

var SWEARWORDS = [
	/.*FUCK.*/i,
	/(^|\W)CUNT(\W|$)/i,
	/(^|\W)TWAT(\W|$)/i,
	/.*MALCOLM TUCKER.*/i,
	/.*BALACLAVA.*/i,
	/(^|\W)STFU(\W|$)/i,
];

var MALCOLMS = [];

LOUDBOT.prototype.FUCK_SOMETHING_UP = function FUCK_SOMETHING_UP(DATA)
{
	const THIS = this;
	var MSG = DATA.text;

	if (MSG.match(/FUCKITY/i))
	{
		LOG('FUCKITY BYE');
		THIS.YELL(DATA, 'https://cldup.com/NtvUeudPtg.gif');
		return;
	}

	if (!MALCOLMS.length)
	{
		MALCOLMS = [].concat(DEMAND('./MALCOLM'));
		SHUFFLE(MALCOLMS);
	}

	for (var I = 0; I < SWEARWORDS.length; I++)
	{
		if (MSG.match(SWEARWORDS[I]) && ROLL_D100(85))
		{
			LOG('MALCOLM HAS BEEN INVOKED');
			THIS.YELL(DATA, MALCOLMS.pop());
			return true;
		}
	}
};

var CAFFEINATED_OWLS = {
	DECAF: 'UNCAFFEINATED OWL https://cldup.com/JM72VfTzb2.gif',
	HALFCAF: 'HALF-CAFFEINATED OWL https://cldup.com/uGcnEqjE6DS/SajHK9.gif',
	REGULAR: 'COFFEE REGULAR OWL https://cldup.com/uGcnEqjE6DS/sJwKwB.gif',
	IRISH: 'CAFFEINATED OWL  https://cldup.com/uGcnEqjE6DS/TiHxjZ.gif',
	ESPRESSO: 'CAFFEINATED OWL https://cldup.com/uGcnEqjE6DS/ovOaes.gif',
	DOUBLE: 'CAFFEINATED OWL https://cldup.com/uGcnEqjE6DS/7lhdMq.gif',
};

LOUDBOT.prototype.CAFFEINATE = function CAFFEINATE(DATA)
{
	// LOUDBOT, LIKE YOU, ENJOYS COFFEE.
	const THIS = this;
	var MSG = DATA.text;
	var RESPONSE;

	if (MSG.match(/DECAF/i)) RESPONSE = CAFFEINATED_OWLS.DECAF;
	if (MSG.match(/HALFCAF/i)) RESPONSE = CAFFEINATED_OWLS.HALFCAF;
	if (MSG.match(/COFFEE|LATTE/i) && ROLL_D100(20)) RESPONSE = CAFFEINATED_OWLS.REGULAR;
	if (MSG.match(/IRISH\s+COFFEE|WHISKE?Y/i) && ROLL_D100(50)) RESPONSE = CAFFEINATED_OWLS.IRISH;
	if (MSG.match(/ESPRESSO/i)) RESPONSE = CAFFEINATED_OWLS.ESPRESSO;
	if (MSG.match(/DOUBLE\s+ESPRESSO/i)) RESPONSE = CAFFEINATED_OWLS.DOUBLE;

	if (RESPONSE) THIS.YELL(DATA, RESPONSE);
	return !!RESPONSE;
};

var ZEROWING = [
	'IN AD 2101, WAR WAS BEGINNING.', // 0
	'https://cldup.com/QHwhtqJ4xb.gif', // 1 what happen
	'https://cldup.com/eQ71VnK9CI.gif', // 2 SOMEBODY SET UP US THE BOMB.',
	'https://cldup.com/e4CJmll1-3.gif', // 3 we get signal
	'https://cldup.com/7P5Vo6b8jP.png', // 4 main screen
	'https://cldup.com/k4PWufr3K2.gif', // 5 it's you
	'https://cldup.com/UmAVfwTW_z.gif', // 6 how are you gentlemen
	'https://cldup.com/vVm3_dQjux.gif', // 7 all your base
	'https://cldup.com/EOFiuOiHiX.gif', // 8 YOU ARE ON THE WAY TO DESTRUCTION.
	'https://cldup.com/5TrqkN8yQB.gif', // 9 what you say
	'https://cldup.com/-_4nLzuNkB.gif', // 10 YOU HAVE NO CHANCE TO SURVIVE MAKE YOUR TIME.
	'https://cldup.com/kIWncmoiVs.gif', // 11 HA HA HA HA ....
	'https://cldup.com/oogMcvDZnB.gif', // 12 TAKE OFF EVERY ZIG!!
	'https://cldup.com/AXu9-k4E2q.gif', // 13 YOU KNOW WHAT YOU DOING.
	'https://cldup.com/LaL_bsCZ_1.gif', // 14 MOVE ZIG.
	'https://cldup.com/2gidctcHWh.gif', // 15 FOR GREAT JUSTICE..
];

LOUDBOT.prototype.ZIG_INTERVAL = null;
LOUDBOT.prototype.DID_ZIG = false;

LOUDBOT.prototype.TAKE_OFF_ZIG = function TAKE_OFF_ZIG(DATA)
{
	var ZIG_PTR;
	const THIS = this;
	var MSG = DATA.text;
	if (THIS.DID_ZIG) return false;

	if (MSG.match(/(GREAT\s?JUSTICE|EVERY ZIG|ALL YOUR BASE|SET US UP THE BOMB|MOVE ZIG|MAIN SCREEN TURN\s?ON)/i))
	{
		ZIG_PTR = 0;
		THIS.DID_ZIG = true;
		setTimeout(HAHAHAHA, 1000);
		return true;
	}

	function HAHAHAHA()
	{
		THIS.YELL(DATA, ZEROWING[ZIG_PTR]);
		ZIG_PTR++;
		if (ZIG_PTR < ZEROWING.length)
			THIS.ZIG_INTERVAL = setTimeout(HAHAHAHA, 10000);
	}
};

LOUDBOT.prototype.CHOOSE_EMOJI = function CHOOSE_EMOJI(MSG)
{
	if (MSG.match(/BANANA/i))
		return 'banana';

	if (MSG.match(/RACCOON/i))
		return 'raccoon';

	if (MSG.match(/WOMBAT/i) && ROLL_D100(75))
		return 'wombat';

	if (MSG.match(/SHIP\s*IT/i) && ROLL_D100(50))
		return 'sheep';

	if ((MSG.match(/ELDER\s*GOD/i) || MSG.match(/CTHULHU/i)) && ROLL_D100(75))
		return 'cthulhu';

	if (MSG.match(/MILL?HOUSE/i) || MSG.match(/COMING\s+UP\W/i) || MSG.match(/NIXON/i) && ROLL_D100(75))
		return 'milhouse';

	if ((MSG.match(/GOSLING/i) || MSG.match(/GOOSE/i) || MSG.match(/GANDER/i)) && ROLL_D100(75))
		return 'goose';

	for (var I = 0; I < EMOJI_PATTERNS.length; I++)
	{
		if (MSG.match(EMOJI_PATTERNS[I]) && ROLL_D100(20))
			return EMOJI[I];
	}

	if (MSG.match(/(\?|!)/) && ROLL_D100(2))
		return EMOJI[Math.floor(Math.random() * EMOJI.length)];
};

LOUDBOT.prototype.DOEMOJI = function DOEMOJI(DATA)
{
	// SOMETIMES LOUDBOT USES EMOJI
	const THIS = this;

	var EMO = THIS.CHOOSE_EMOJI(DATA.text);
	if (!EMO)
		return;

	var OPTS = {
		channel: DATA.channel,
		timestamp: DATA.ts
	};
	THIS.WEB.reactions.add(EMO, OPTS, function(ERROR, RESPONSE)
	{
		if (ERROR)
		{
			LOG(JSON.stringify(ERROR));
			LOG(RESPONSE);
		}
	});
};

LOUDBOT.prototype.HANDLE_SPECIALS = function HANDLE_SPECIALS(DATA)
{
	const THIS = this;
	const MSG = DATA.text;
	if (!MSG) return;

	if (MSG.match(/CLOWN\s*SHOES/i))
	{
		THIS.YELL(DATA, 'https://i.cloudup.com/MhNp5cf7Fz.gif');
		return true;
	}

	if (MSG.match(/WRETCHED.+HIVE/i) || MSG.match(/SCUM.+VILLAINY/i))
	{
		this.YELL(DATA, 'WE MUST BE CAUTIOUS.');
		return true;
	}

	if (MSG.match(/PASSWORD/i))
	{
		this.YELL(DATA, 'MY VOICE IS MY PASSPORT. VERIFY ME.');
		return true;
	}

	if (MSG.match(/GOT\s+A\s+THEORY/i))
	{
		this.YELL(DATA, 'I\'VE GOT A THEORY THAT IT\'S A DEMON, A DANCING DEMON-- NO, SOMETHING ISN\'T RIGHT THERE.');
		return true;
	}

	if (MSG.match(/TABLEFLIP$/i))
	{
		THIS.YELL(DATA, '(╯°□°）╯︵ ┻━┻');
		return true;
	}

	if (MSG.match(/(TABLE)?FLIP\s+\S+/))
	{
		const MATCHES = MSG.match(/FLIP\s+(.*)/);
		const FLIPPED = MATCHES[1] ? FLIP(MATCHES[1]) : '┻━┻';
		THIS.YELL(DATA, `(╯°□°）╯︵ ${FLIPPED}`);
		return true;
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

LOUDBOT.prototype.REBEL_YELL = function REBEL_YELL(DATA)
{
	if (!ISLOUD(DATA.text))
		return false;

	var LOUD;
	const THIS = this;
	THIS.REMEMBER(DATA.text);

	if (ROLL_D100(2))
		LOUD = THIS.MARKOV.makeSentence();
	else
		LOUD = THIS.LOUDS.shift();

	if (!THIS.LOUDS.length)
		THIS.LOAD_ALL_LOUDS();

	if (LOUD) THIS.YELL(DATA, LOUD);
	else LOG('WHAT THE HELL EMPTY LOUD?');
	return true;
};

LOUDBOT.prototype.YELL = function YELL(DATA, LOUD)
{
	const THIS = this;
	LOG(`YELLING "${LOUD}" to ${DATA.channel} BECAUSE: ${DATA.text}`);
	THIS.RTM.sendMessage(LOUD, DATA.channel);
	THIS.COUNT++;
};

LOUDBOT.prototype.REPORT = function REPORT(DATA)
{
	if (!DATA.text.match(/LOUDBOT:?\s+REPORT/))
		return;

	const THIS = this;
	var LOUD = 'I HAVE YELLED ' + (THIS.COUNT === 1 ? 'ONCE.' : `${THIS.COUNT} TIMES.`);
	LOUD += ` I HAVE ${THIS.LOUDS.length} UNIQUE THINGS TO SAY.`;
	THIS.RTM.sendMessage(LOUD, DATA.channel);
	return true;
};

if (require.main === module)
{
	require('dotenv').config({silent: true});
	var ASSERT = require('assert');
	ASSERT(process.env.SLACK_API_TOKEN, 'YOU MUST PROVIDE A SLACK API TOKEN IN THE ENVIRONMENT VARIABLE SLACK_API_TOKEN.');

	var LOUDIE = new LOUDBOT();
	LOUDIE.GOGOGO();
}
