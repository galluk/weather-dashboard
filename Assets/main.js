// my openweather api key: 4b7ebd856fc09df0dc4916c482ff2e47
// https://api.openweathermap.org/data/2.5/weather?q={city name}&appid={your api key}
// http://api.openweathermap.org/data/2.5/onecall?lat=-33.87&lon=151.21&exclude=minutely,hourly&appid=4b7ebd856fc09df0dc4916c482ff2e47
const BASE_ICON_URL = "http://openweathermap.org/img/wn/";
const APPEND_ICON_URL = ".png"
const HISTORY_STORAGE_NAME = "search-history";

var listHistory = document.querySelector("#listHistory");

var searchHistory = []; //array of strings

function getUVIndexRisk(uvValue) {
    if (uvValue < 3) { return "low" }
    else if (uvValue < 6) { return "moderate" }
    else if (uvValue < 8) { return "high" }
    else if (uvValue < 11) { return "veryhigh" }
    else { return "extreme" }
}

function updateUVindex(val) {
    $("#spanUV").text(val);
    var spanClass = getUVIndexRisk(val);
    $("#spanUV").addClass(spanClass);
}

function updateForecast(resp) {
    // first set the current UV index as this isn't in the weather? response that is called first and used in updateCurrentWeather
    updateUVindex(resp.current.uvi);

    // update the 5 day forecast elements
    for (var i = 1; i < 6; i++) {
        // show the date
        var forecastDate = dayjs.unix(resp.daily[i - 1].dt);
        $("#hDay" + i).text(dayjs(forecastDate).format('DD/MM/YYYY'));

        // show the icon for the weather
        var iconURL = BASE_ICON_URL + resp.daily[i - 1].weather[0].icon + APPEND_ICON_URL;
        $("#iDay" + i).attr("src", iconURL);
        // show the temp
        $("#spanTemp" + i).text(kelvinToDegreesC(resp.daily[i - 1].temp.max));
        // and the humidity
        $("#spanHum" + i).text(resp.daily[i - 1].humidity);
    }
}

function getCityForecast(latitude, longitude) {
    // get the 5 day forecast using the lat/long from previous call. Exclude minute and hour data as not needed.
    var searchParams = "lat=" + latitude + "&lon=" + longitude + "&exclude=minutely,hourly"
    var queryForecast = "https://api.openweathermap.org/data/2.5/onecall?" + searchParams + "&appid=4b7ebd856fc09df0dc4916c482ff2e47";

    $.ajax({
        url: queryForecast,
        method: "GET",
    }).then(function (response) {
        console.log(response);
        updateForecast(response);
    });

}

// the provided temps are in Kelvin so convert to Celsius for display
function kelvinToDegreesC(temp) {
    return (temp - 273.15).toFixed(1);
}

function updateCurrentWeather(resp) {
    // show the date
    var today = dayjs.unix(resp.dt);
    $("#hCity").text(resp.name + " (" + dayjs(today).format('DD/MM/YYYY') + ")");

    var iconURL = BASE_ICON_URL + resp.weather[0].icon + APPEND_ICON_URL;
    $("#iCurrent").attr("src", iconURL);
    $("#spanTemp").text(kelvinToDegreesC(resp.main.temp));
    $("#spanHum").text(resp.main.humidity);
    $("#spanWind").text(resp.wind.speed);
}
 
function loadHistory() {
    var storedHistory = localStorage.getItem(HISTORY_STORAGE_NAME);

    if (storedHistory) {
        searchHistory = JSON.parse(storedHistory);
    }

    // add the history to the list on the page, clearing it first
    listHistory.innerHTML = "";

    if (searchHistory.length > 0) {
        // add the items loaded from storage
        for (var i = 0; i < searchHistory.length; i++) {
            // add item to the list
            var li = $("<li>");
            $(li).text(searchHistory[i]);
            // prepend so they are in order of the most recently used first
            $(listHistory).prepend(li);
        }

        // and show the last searched city
        getCityWeather(searchHistory[searchHistory.length - 1], false);
    }
}

function saveSearchItem(itemVal) {
    // add the item to the list
    var li = $("<li>");
    $(li).text(itemVal);
    $(listHistory).prepend(li);

    // and add it to memory
    searchHistory.push(itemVal);
    // then save
    localStorage.setItem(HISTORY_STORAGE_NAME, JSON.stringify(searchHistory));
}

function getCityWeather(cityName, saveItem) {

    var queryCurrent = "https://api.openweathermap.org/data/2.5/weather?q=" + cityName + "&appid=4b7ebd856fc09df0dc4916c482ff2e47";

    // get the current weather
    $.ajax({
        url: queryCurrent,
        method: "GET",
    }).then(function (response) {
        console.log(response);
        updateCurrentWeather(response);
        getCityForecast(response.coord.lat, response.coord.lon);
        if (saveItem) {
            saveSearchItem(response.name);
        }
    });
}

// on load of page load any history
loadHistory();

// event handler for search button
$("#btnSearch").on("click", function () {
    getCityWeather($("#citySearch").val().trim(), true);
});

// event handler for the searh history list
$(function() {
    // do the mouse pointer change
    $('li').css('cursor', 'pointer')
    // and get the weather for the iteem clicked on without saving
    .click(function() {
        getCityWeather($(this).text(), false);
    });
});