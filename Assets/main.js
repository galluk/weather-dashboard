// my openweather api key: 4b7ebd856fc09df0dc4916c482ff2e47
// https://api.openweathermap.org/data/2.5/weather?q={city name}&appid={your api key}
// http://api.openweathermap.org/data/2.5/onecall?lat=-33.87&lon=151.21&exclude=minutely,hourly&appid={your api key}
const BASE_ICON_URL = "http://openweathermap.org/img/wn/";
const APPEND_ICON_URL = ".png"
const HISTORY_STORAGE_NAME = "search-history";

var listHistory = document.querySelector("#listHistory");
var lastUVIndexClass = ''; // keep track of the last used class so it can be removed
var searchHistory = []; //array of strings

// get the uv risk index for the given uv value. These came from wikipedia
// (https://en.wikipedia.org/wiki/Ultraviolet_index#:~:text=A%20UV%20index%20reading%20of%206%20to%207%20means%20high,%2C%20and%20UV%2Dblocking%20sunglasses.)
function getUVIndexRisk(uvValue) {
    if (uvValue < 3) { return "low" }
    else if (uvValue < 6) { return "moderate" }
    else if (uvValue < 8) { return "high" }
    else if (uvValue < 11) { return "veryhigh" }
    else { return "extreme" }
}

// get the correct class for css styling to display the uv index span background colour
function updateUVindex(val) {
    $("#spanUV").text(val.toFixed(2));
    // remove the last used class
    $("#spanUV").removeClass(lastUVIndexClass);
    // get and add the correct class for rendering
    lastUVIndexClass = getUVIndexRisk(val);
    $("#spanUV").addClass(lastUVIndexClass);
}

// given the resp from the api, update the forecast elements data
function updateForecast(resp) {
    // first set the current UV index as this isn't in the weather? response that is called first and used in updateCurrentWeather
    // it's only in the onecall? api method query so update it here
    updateUVindex(resp.current.uvi);

    // update the 5 day forecast elements
    var maxNumDays = resp.daily.length;
    // only want to do 5...
    if (maxNumDays > 5) {
        maxNumDays = 5;
    }

    // check for max number of days (if it's 0 none will be done)
    for (var i = 1; i <= maxNumDays; i++) {
        // show the date. Using i-1 as the start is from 1 to get the corresponding elements
        var forecastDate = dayjs.unix(resp.daily[i - 1].dt);
        $("#hDay" + i).text(dayjs(forecastDate).format('DD/MM/YYYY'));

        // show the icon for the weather
        var iconURL = BASE_ICON_URL + resp.daily[i - 1].weather[0].icon + APPEND_ICON_URL;
        $("#iDay" + i).attr("src", iconURL);
        // show the temp in deg C
        $("#spanTemp" + i).text(kelvinToDegreesC(resp.daily[i - 1].temp.max));
        // and the humidity
        $("#spanHum" + i).text(resp.daily[i - 1].humidity);
    }
}

// call the openweather api to get the 5 day forecast data
function getCityForecast(latitude, longitude) {
    // get the 5 day forecast using the lat/long from previous call. Exclude minute and hour data as not needed.
    var searchParams = "lat=" + latitude + "&lon=" + longitude + "&exclude=minutely,hourly"
    var queryForecast = "https://api.openweathermap.org/data/2.5/onecall?" + searchParams + "&appid=4b7ebd856fc09df0dc4916c482ff2e47";

    $.ajax({
        url: queryForecast,
        method: "GET",
    }).then(function (response) {
        // console.log(response);
        updateForecast(response);
    }).fail(function () {
        // if nothing came back alert user and focus and select the search input control
        alert("No forecast data can be found for the city of '" + cityName + "'.");
    });}

// the provided temps are in Kelvin so convert to Celsius for display
function kelvinToDegreesC(temp) {
    return (temp - 273.15).toFixed(1);
}

// use the details in resp to fill the data in for the current weather elements
function updateCurrentWeather(resp) {
    // show the date
    var today = dayjs.unix(resp.dt);
    $("#hCity").text(resp.name + " (" + dayjs(today).format('DD/MM/YYYY') + ")");

    // get the icon for current weather conditions
    var iconURL = BASE_ICON_URL + resp.weather[0].icon + APPEND_ICON_URL;
    $("#iCurrent").attr("src", iconURL);

    // show temp in degrees celsius
    $("#spanTemp").text(kelvinToDegreesC(resp.main.temp));
    // and humidity and speed
    $("#spanHum").text(resp.main.humidity);
    $("#spanWind").text(resp.wind.speed);
}

// create the search history list items from the array 
function constructHistoryList() {
    listHistory.innerHTML = "";
    // add the items 
    for (var i = 0; i < searchHistory.length; i++) {
        // add item to the list
        var li = $("<li>");
        $(li).text(searchHistory[i]);
        // prepend so they are in order of the most recently used first
        $(listHistory).prepend(li);
    }
}

// load the history from local storage and fill the history list
function loadHistory() {
    clearDisplay();

    var storedHistory = localStorage.getItem(HISTORY_STORAGE_NAME);

    if (storedHistory) {
        searchHistory = JSON.parse(storedHistory);
    }

    if (searchHistory.length > 0) {
        constructHistoryList();
        // and show the last searched city
        getCityWeather(searchHistory[searchHistory.length - 1], false);
    }
}

// when user clicks a history item move it to the top of the list
function reorderHistoryList(itemName) {
    var itemIndex = searchHistory.indexOf(itemName);

    // move the item
    if (itemIndex !== -1) {
        searchHistory.splice(itemIndex, 1);
        searchHistory.push(itemName);

        // redo the list
        constructHistoryList();
        // and save
        localStorage.setItem(HISTORY_STORAGE_NAME, JSON.stringify(searchHistory));
    }
}

// empty the display elements of info
function clearDisplay() {
    listHistory.innerHTML = "";

    // clear current
    $("#hCity").text("City");
    $("#iCurrent").attr("src", "");
    $("#spanTemp").text("");
    $("#spanHum").text("");
    $("#spanWind").text("");
    $("#spanUV").text("");

    // remove the last used class
    $("#spanUV").removeClass(lastUVIndexClass);
    lastUVIndexClass = '';

    //clear forecast
    for (var i = 1; i < 6; i++) {
        $("#hDay" + i).text("");
        $("#iDay" + i).attr("src", "");
        $("#spanTemp" + i).text("");
        $("#spanHum" + i).text("");
    }
}

// add the given itemName to the search history list and local storage
function saveSearchItem(itemName) {
    // only add ones that aren't there
    if (searchHistory.indexOf(itemName) === -1) {
        // add the item to the list
        var li = $("<li>");
        $(li).text(itemName);
        $(listHistory).prepend(li);

        // and add it to memory
        searchHistory.push(itemName);
        // then save
        localStorage.setItem(HISTORY_STORAGE_NAME, JSON.stringify(searchHistory));
    }
    else {
        // it's already in the list so reorder
        reorderHistoryList(itemName);
    }
}

// call the weather api for the given cityName, saving the search to history if saveItem is true
function getCityWeather(cityName, saveItem) {

    var queryCurrent = "https://api.openweathermap.org/data/2.5/weather?q=" + cityName + "&appid=4b7ebd856fc09df0dc4916c482ff2e47";

    // get the current weather
    $.ajax({
        url: queryCurrent,
        method: "GET",
    }).then(function (response) {
        // console.log(response);
        updateCurrentWeather(response);
        getCityForecast(response.coord.lat, response.coord.lon);
        if (saveItem) {
            saveSearchItem(response.name);
        }
    }).fail(function () {
        // if nothing came back alert user and focus and select the search input control
        alert("No data can be found for the city of '" + cityName + "'. Check the spelling and try again.");
        $("#citySearch").select();
    });
}

// on load of page load any history
loadHistory();

// event handler for search button
$("#btnSearch").on("click", function () {
    getCityWeather($("#citySearch").val().trim(), true);
});

// event handler for user pressing enter in hte search input
$("#citySearch").on("keyup", function (event) {
    // Number 13 is the "Enter" key on the keyboard
    if (event.keyCode === 13) {
        // Cancel the default action, if needed
        event.preventDefault();
        getCityWeather($("#citySearch").val().trim(), true);
    }
});

// event handler for clear button
$("#btnClear").on("click", function () {
    // empty the arry
    searchHistory = [];
    // then save
    localStorage.setItem(HISTORY_STORAGE_NAME, JSON.stringify(searchHistory));

    clearDisplay();
});

// event handler for the search history list
$(listHistory).on("click", "li", function () {
    // and get the weather for the item clicked on without saving
    getCityWeather($(this).text(), false);
    reorderHistoryList($(this).text());
});

$(listHistory).hover(function () {
    $(this).css('cursor', 'pointer');
});