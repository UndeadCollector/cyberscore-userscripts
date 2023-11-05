// ==UserScript==
// @name		CS-ChartHighlighter
// @version		0.0.3
// @description	Highlights charts for certain games based on user-submitted heuristics (e.g., "ticking off" charts a user has maxed).
// @author		Sellyme
// @match		https://cyberscore.me.uk/game*/*
// @namespace	https://github.com/Sellyme/cyberscore-userscripts/
// @homepageURL	https://github.com/Sellyme/cyberscore-userscripts/
// @downloadURL	https://github.com/Sellyme/cyberscore-userscripts/raw/main/CS-ChartHighlighter.user.js
// @updateURL	https://github.com/Sellyme/cyberscore-userscripts/raw/main/CS-ChartHighlighter.user.js
// @grant		GM_addStyle
// ==/UserScript==
GM_addStyle(
`
#themeDiv {
	float: right;
	margin-right: 5px;
}
`
);
(function(){
	var selectEl = `
<div id="themeDiv">
	<span>Highlight:</span>
	<select id="themeSelect" class="borderRadius" onchange="changeTheme()">
		<option value="none" selected>None</option>
		<option value="first">Firsts</option>
		<option value="submitted">Submitted</option>
	</select>
</div>`;
	var basestyle = "tr.none{background-color:rgb(17,81,17) !important;}";

	function addStyle(style) {
		var headEl = document.getElementsByTagName("head")[0];
		var styleEl = document.createElement("style");
		styleEl.setAttribute("id", "chartHighlightRules");
		styleEl.type="text/css";
		styleEl.appendChild(document.createTextNode(style));
		headEl.appendChild(styleEl);
	}

	unsafeWindow.changeTheme = function() {
		var style = basestyle;
		var theme = document.getElementById('themeSelect').value;
		style = style.replace("none",theme);
		var rules = document.getElementById('chartHighlightRules');
		if (rules) {
			rules.remove();
		}
		addStyle(style);
	}

	//insert the selector
	var pageleft = document.getElementById('pageleft');
	pageleft.innerHTML = selectEl + pageleft.innerHTML;
	addStyle(basestyle);

	function setupGame(gameNum) {
		let tagFunction;
		switch(gameNum) {
			case 3225:
				tagFunction = tagMelvor;
				addCustomHighlight("melvor99", "Melvor 99s/120s");
				break;
			case 3231:
				tagFunction = tagFinalBarLine;
				addCustomHighlight("maxed", "9,999,999s");
				break;
			case 3279:
				tagFunction = tagPokeclicker;
				addCustomHighlight("resisted", "EV Resisted")
				break;
			default:
				tagFunction = tagGeneric;
		}
		return tagFunction;
	}
	function addCustomHighlight(value, desc) {
		let newOpt = document.createElement('option');
		newOpt.value = value;
		newOpt.innerText = desc;
		let sel = document.getElementById('themeSelect');
		sel.appendChild(newOpt);
	}

	//this set of functions is called on any chart row if the user has a valid score on that chart
	//the exact behaviour of how to tag it varies by game
	//they receive the group name and chart row as arguments
	function tagMelvor(gname,crow,userScore,firstScore) {
		tagGeneric(gname,crow,userScore,firstScore);
		if(gname.includes(" XP")) {
			let target = 13034431; //Level 99 Mastery
			if(gname.includes("Skill")) {
				target = 104273167; //Level 120 Skill
			}
			userScore = parseInt(userScore);
			if(userScore > target) {
				crow.classList.add('melvor99');
			}
		}
	}
	function tagFinalBarLine(gname,crow,userScore,firstScore) {
		tagGeneric(gname,crow,userScore,firstScore);
		if(gname.includes("High Score")) {
			let target = 9999999;
			userScore = parseInt(userScore);
			if(userScore==target) {
				crow.classList.add('maxed');
			}
		}
	}
	function tagPokeclicker(gname,crow,userScore,firstScore) {
		tagGeneric(gname,crow,userScore,firstScore);
		if(gname.includes("EVs")) {
			let target = 50;
			userScore = parseInt(userScore);
			if(userScore >= target) {
				crow.classList.add('resisted');
			}
		}
	}
	function tagGeneric(gname,crow,userScore,firstScore) {
		crow.classList.add('submitted');
		if(userScore == firstScore) {
			crow.classList.add('first');
		}
	}

	const urlComponents = window.location.href.split("/")
	const gameNum = parseInt(urlComponents[urlComponents.length - 1])
	let tagFunction = setupGame(gameNum);

	let groups;
		//skip any enhancedTableLayout tables
	let masterTable = document.querySelectorAll('.gamelist:not(.enhancedTable)')[0];
	let tables = masterTable.getElementsByClassName('all'); //default, override as needed

	console.log("Iterating over tables");
	for(var t = 0; t < tables.length; t++) {
		let table = tables[t];
		//get group name
		let gname = table.firstElementChild.children[1].innerText.trim();

		//iterate over all row children of the table
		for(var r = 1; r < table.children.length; r++) {
			let crow = table.children[r];
			let scoreCell = crow.children[2];
			let scores = scoreCell.innerText.split(" /");
			let userScore = scores[0].trim().replaceAll(",","");
			let firstScore = scores[1].trim().replaceAll(",","");
			//check for missing scores
			if(userScore != "-") {
				//users has submitted a score, so add submitted class
				tagFunction(gname, crow, userScore, firstScore);
			}
		}
	}
})();
