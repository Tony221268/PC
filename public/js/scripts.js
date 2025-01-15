/* Detect Language and set Cookies*/

function setCookie(name, value, days) {
  var expires = "";
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(cname) {
  var name = cname + "=";
  var ca = document.cookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1);
    if (c.indexOf(name) == 0)
      return c.substring(name.length, c.length);
  }
  return "";
}
function changeCountry(country) {
  if (country.toLowerCase != 'en') {
    window.location.replace(location.protocol + "/" + country.toLowerCase());
  }
  else {
    window.location.replace(location.protocol + "/");
  }
};

/* The twisted logic */
/* 

First check if we have a cookie set to choose language. 
If so, if it is English then do nothing unless they are on French or Spanish in which case move them to Erglish. 
If so, but not English, only move them if they don't have a url with their country in it.

If not, get a location from IP api. Use that to set cookies and change location unless it is English, in which case they stay where they are.
This means that they can use French if they want to without choosing a language whereas the French have to choose English. 
For Russia and other similar set a blank cookie before redirecting so that if they come back they start again.

Language choosers can override the language cookie at any time.

*/
var countryCookie = getCookie("language").toLowerCase();
var currentURL = window.location.href;
if (countryCookie == "en") {
  if (currentURL.includes("/es/") || currentURL.includes("/fr/")) {
    changeCountry(countryCookie);
  };
}
else {
  if (countryCookie != "") {
    var country = getCookie("language").toLowerCase();
    /* Only change if our user happens to have found a URL that is not our country */
    if (!currentURL.includes("/" + country + "/")) {
      changeCountry(country);
    }
  }
  /* If the user has not set a country, lets find them a country: check for French then Spanish speaker country IPs or default to English. Redirect countries we don't deel with */
  else {
    fetch('https://ipapi.co/country/')
      .then((response) => {
        if (response.ok) {
          return response.text();
        } else {
          throw new Error('HTTP Error ' + response.status);
        }
      }
      )
      .then(country => {
        const frenchSpeakers = ['BE', 'BJ', 'BF', 'CD', 'CF', 'CH', 'CI', 'CM', 'DZ', 'FR', 'GA', 'GF', 'GN', 'HT', 'LU', 'MA', 'MC', 'MF', 'MG', 'ML', 'NE', 'PF', 'RE', 'RW', 'SN', 'TD', 'TF', 'TG', 'TN',];
        const spanishSpeakers = ['AR', 'BO', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'ES', 'GT', 'GQ', 'HN', 'MX', 'NI', 'PA', 'PE', 'PR', 'PY', 'SV', 'UY', 'VE'];
        const undesirables = ['RU', 'BY']
        country = 'en';
        if (frenchSpeakers.includes(country)) {
          country = 'fr';
        }
        if (spanishSpeakers.includes(country)) {
          country = 'es';
        }
        if (undesirables.includes(country)) {
          setCookie("");
          window.location.replace("https://www.consilium.europa.eu/en/policies/sanctions/restrictive-measures-against-russia-over-ukraine/");
        }
        setCookie(country);
        if (country != "en") {
          if (!currentURL.includes("/"+ country +"/")) {
            changeCountry(country);
          }
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  }
};


/*


 Search using Fuse.js*/


summaryInclude = 60;
var fuseOptions = {
  shouldSort: true,
  includeMatches: true,
  threshold: 0.0,
  tokenize: true,
  location: 0,
  distance: 100,
  maxPatternLength: 32,
  minMatchCharLength: 1,
  keys: [
    { name: "title", weight: 0.8 },
    { name: "contents", weight: 0.5 },
    { name: "tags", weight: 0.3 },
    { name: "categories", weight: 0.3 }
  ]
};


var searchQuery = param("s");
if (searchQuery) {
  $("#search-query").val(searchQuery);
  executeSearch(searchQuery);
} else if (document.getElementById('noresult')) {
  document.getElementById('noresult').style.display = 'block';
}



function executeSearch(searchQuery) {
  let searchLang = document.querySelector("html").getAttribute("lang");
  let searchJSONLocation = ("/" + searchLang + "/index.json");
  if (searchLang == "en") {
    searchJSONLocation = "/index.json"
  }
  console.log(searchJSONLocation)
  $.getJSON(searchJSONLocation, function (data) {
    var pages = data;
    var fuse = new Fuse(pages, fuseOptions);
    var result = fuse.search(searchQuery);
    console.log({ "matches": result });
    if (result.length > 0) {
      populateResults(result);
    } else {
      document.getElementById('noresult').style.display = 'block';
    }
  });
}

function populateResults(result) {
  $.each(result, function (key, value) {
    var contents = value.item.contents;
    var snippet = "";
    var snippetHighlights = [];
    var tags = [];
    if (fuseOptions.tokenize) {
      snippetHighlights.push(searchQuery);
    } else {
      $.each(value.matches, function (matchKey, mvalue) {
        if (mvalue.key == "tags" || mvalue.key == "categories") {
          snippetHighlights.push(mvalue.value);
        } else if (mvalue.key == "contents") {
          start = mvalue.indices[0][0] - summaryInclude > 0 ? mvalue.indices[0][0] - summaryInclude : 0;
          end = mvalue.indices[0][1] + summaryInclude < contents.length ? mvalue.indices[0][1] + summaryInclude : contents.length;
          snippet += contents.substring(start, end);
          snippetHighlights.push(mvalue.value.substring(mvalue.indices[0][0], mvalue.indices[0][1] - mvalue.indices[0][0] + 1));
        }
      });
    }

    if (snippet.length < 1) {
      snippet += contents.substring(0, summaryInclude * 2);
    }
    //pull template from hugo templarte definition
    var templateDefinition = $('#search-result-template').html();
    //replace values
    var output = render(templateDefinition, { key: key, title: value.item.title, link: value.item.permalink, tags: value.item.tags, categories: value.item.categories, snippet: snippet });
    $('#search-results').append(output);

    $.each(snippetHighlights, function (snipkey, snipvalue) {
      $("#summary-" + key).mark(snipvalue);
    });

  });
}

function param(name) {
  return decodeURIComponent((location.search.split(name + '=')[1] || '').split('&')[0]).replace(/\+/g, ' ');
}

function render(templateString, data) {
  var conditionalMatches, conditionalPattern, copy;
  conditionalPattern = /\$\{\s*isset ([a-zA-Z]*) \s*\}(.*)\$\{\s*end\s*}/g;
  //since loop below depends on re.lastInxdex, we use a copy to capture any manipulations whilst inside the loop
  copy = templateString;
  while ((conditionalMatches = conditionalPattern.exec(templateString)) !== null) {
    if (data[conditionalMatches[1]]) {
      //valid key, remove conditionals, leave contents.
      copy = copy.replace(conditionalMatches[0], conditionalMatches[2]);
    } else {
      //not valid, remove entire section
      copy = copy.replace(conditionalMatches[0], '');
    }
  }
  templateString = copy;
  //now any conditionals removed we can do simple substitution
  var key, find, re;
  for (key in data) {
    find = '\\$\\{\\s*' + key + '\\s*\\}';
    re = new RegExp(find, 'g');
    templateString = templateString.replace(re, data[key]);
  }
  return templateString;
}

// utility functions
if (!Util) function Util() { };

Util.addClass = function (el, className) {
  var classList = className.split(' ');
  el.classList.add(classList[0]);
  if (classList.length > 1) Util.addClass(el, classList.slice(1).join(' '));
};

Util.removeClass = function (el, className) {
  var classList = className.split(' ');
  el.classList.remove(classList[0]);
  if (classList.length > 1) Util.removeClass(el, classList.slice(1).join(' '));
};

Util.toggleClass = function (el, className, bool) {
  if (bool) Util.addClass(el, className);
  else Util.removeClass(el, className);
};


// Pricing Page

(function () {
  var pTable = document.getElementsByClassName('price-switches');
  if (pTable.length > 0) {
    for (var i = 0; i < pTable.length; i++) {
      (function (i) { addPTableEvent(pTable[i]); })(i);
      (function (i) { addPTableEventCurrency(pTable[i]); })(i);
    }

    function addPTableEvent(element) {
      var pSwitch = element.getElementsByClassName('period-switch')[0]
      if (pSwitch) {
        pSwitch.addEventListener('change', function (event) {
          Util.toggleClass(element, 'price-yearly', (event.target.value == 'yearly'));
        });
      }
    }

    function addPTableEventCurrency(element) {
      var pSwitch = element.getElementsByClassName('currency-switch')[0];
      var active = element.getElementsByClassName("activ");

      if (pSwitch) {
        $(active).removeClass('active');
        pSwitch.addEventListener('change', function (event) {
          Util.toggleClass(element, 'price-euros', (event.target.value == 'euros'));
        });
        pSwitch.addEventListener('change', function (event) {
          Util.toggleClass(element, 'price-gbp', (event.target.value == 'gbp'));
        });
      }
    }
  }
}());
