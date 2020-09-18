// my openweather api key: 4b7ebd856fc09df0dc4916c482ff2e47
// https://api.openweathermap.org/data/2.5/weather?q={city name}&appid={your api key}
// http://api.openweathermap.org/data/2.5/onecall?lat=-33.87&lon=151.21&exclude=minutely,hourly&appid=4b7ebd856fc09df0dc4916c482ff2e47


function updateForecast(resp) {
    // update the forecast 
    for (var i = 1; i < 6; i++) {
        // show the date
        var forecastDate = dayjs.unix(resp.daily[i - 1].dt);
        $("#hDay" + i).text(dayjs(forecastDate).format('DD/MM/YYYY'));

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

    $("#spanTemp").text(kelvinToDegreesC(resp.main.temp));
    $("#spanHum").text(resp.main.humidity);
    $("#spanWind").text(resp.wind.speed);
}

function getCityWeather(cityName) {

    var queryCurrent = "https://api.openweathermap.org/data/2.5/weather?q=" + cityName + "&appid=4b7ebd856fc09df0dc4916c482ff2e47";

    // get the current weather
    $.ajax({
        url: queryCurrent,
        method: "GET",
    }).then(function (response) {
        console.log(response);
        updateCurrentWeather(response);
        getCityForecast(response.coord.lat, response.coord.lon);
    });
}

// event handler for search button
$("#btnSearch").on("click", function () {
    getCityWeather($("#citySearch").val().trim());
});