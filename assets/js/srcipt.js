const apiKey = 'a56d6b991f888d181b4cac2554707932';

// Instantiate necessary variables to work with from the html page 
var cityInput = document.querySelector('#cityInput');
var cityButton = document.querySelector('#cityButton');
var zipInput = document.querySelector('#zipInput');
var zipButton = document.querySelector('#zipButton');
var sideNav = document.querySelector('#sideNav');
var currentWeather = document.querySelector('#currentWeather');
var forecastWeather = document.querySelector('#forecastWeather');

// Read the stored previous searches from the localStorage
var currentCity = localStorage.getItem('currentCity') || 'Los Angeles';
var cityArray = JSON.parse(localStorage.getItem('cityArray')) || [];
var currentCoords = {
    lat: 0,
    lon: 0
};

// Function for calling open weather API based on the searchParam
// searchParam can be a ZIP code number
// or a city name
var getWeatherData = function (searchParam) {

    console.log(typeof(searchParam));

    let initialFetchURL = 'https://api.openweathermap.org/geo/1.0/direct?q=' + searchParam + '&limit=1&appid=' + apiKey;
    let switchValue = false;
    let secondaryFetchURL = '';
    let cityName = '';

    if (typeof(searchParam) === 'number') {
        initialFetchURL = 'http://api.openweathermap.org/geo/1.0/zip?zip=' + searchParam + '&appid=' + apiKey;
        switchValue = true; 
    }

    // Use the openweather API to query for lat / lon based on city name.
    fetch(initialFetchURL)
        .then((response) => {
            return response.json();
        }).then((data) => {
            console.log(data);

            if (switchValue) {
                secondaryFetchURL = 'https://api.openweathermap.org/data/2.5/onecall?lat=' + data.lat + '&lon=' + data.lon + '&units=imperial&appid=' + apiKey;
                cityName = data.name; 
            } else {
                secondaryFetchURL = 'https://api.openweathermap.org/data/2.5/onecall?lat=' + data[0].lat + '&lon=' + data[0].lon + '&units=imperial&appid=' + apiKey;
                cityName = data[0].name; 
            }
            // Get the current weather
            fetch(secondaryFetchURL)
                .then((response) => {
                    return response.json();
                }).then((data) => {
                    console.log(data);
                    updateWeatherDisplay(data, cityName);
                })
        }).catch((err) => {
            console.error('outer', err.message);
        });
}

// Hanlde the city name weather forecast search
var cityButtonClick = function () {
    let currentCity = cityInput.value;
    if (currentCity) {
        if (cityArray.includes(currentCity)) {
            getWeatherData(currentCity);
            return;
        }

        localStoragePush(currentCity);
        cityInput.value = '';
    }
}

// Hanlde the ZIP weather forecast search
var zipButtonClick = function () {
    let currentZip = zipInput.value;
    if (currentZip) {
        if (cityArray.includes(currentZip)) {
            getWeatherData(Number(currentZip));
            return;
        }

        localStoragePush(Number(currentZip));
        zipInput.value = '';
    }
}

// Push the searchParam to local storage if it doesn't already exist there
var localStoragePush = function (searchParam) {
    let altParamToString = '';

    if (typeof(searchParam) === 'number') {
        altParamToString = searchParam;
        localStorage.setItem('currentCity', Number(altParamToString));
        cityArray.push(altParamToString.toString());
    } else {
        localStorage.setItem('currentCity', searchParam);
        cityArray.push(searchParam);
    }
    
    localStorage.setItem('cityArray', JSON.stringify(cityArray));
    updateSideNav();
    cityInput.value = '';
    zipInput.value = '';
    getWeatherData(searchParam);
}

// Simple function for displayinga UV index 
var getUvIndexColor = function (uvi) {
    if ( uvi < 3 ) {
        return 'green';
    } else if ( uvi < 6 ) {
        return 'yellow';
    } else {
        return 'red';
    }
}

// Create a component for a current/today's weather forecast display 
var drawCurrent = function (data, cityName) {
    //Clear existing weather data.
    currentWeather.innerHTML = '';

    //Create the elements
    var cardTitle = document.createElement('h2');
    var temp = document.createElement('p');
    var wind = document.createElement('p');
    var humidity = document.createElement('p');
    var uvindex = document.createElement('p');
    var icon = document.createElement('img');
    icon.setAttribute('src',`https://openweathermap.org/img/w/${data.weather[0].icon}.png`);

    // Calculate UV Index color
    var color = getUvIndexColor(data.uvi);

    // Add the data 
    cardTitle.textContent = cityName + ` ${new Date((data.dt + timeZoneOffset) * 1000).toLocaleDateString()}`;
    cardTitle.append(icon);
    temp.textContent = `Temp: ${Math.ceil(data.temp)}°F`;
    wind.textContent = `Wind: ${data.wind_speed}MPH`;
    humidity.textContent = `Humidity: ${data.humidity}%`;
    uvindex.innerHTML = `UV index: <span class='${color}'>${data.uvi}</span>`;

    // Add elements to the page
    currentWeather.appendChild(cardTitle);
    currentWeather.appendChild(temp);
    currentWeather.appendChild(wind);
    currentWeather.appendChild(humidity);
    currentWeather.appendChild(uvindex);
}

// Create a single card for the extended forecast 
var createCard = function (data) {
    // Create card elements
    var cardDiv = document.createElement('div');
    var cardImg = document.createElement('img');
    var cardBody = document.createElement('div');
    var cardHdr = document.createElement('h3');
    var cardTemp = document.createElement('p');
    var cardWind = document.createElement('p');
    var cardHumi = document.createElement('p');

    //style
    cardDiv.classList.add('card', 'col-12', 'col-sm-4', 'col-lg-3', 'custom-card', 'bg-light', 'm-1', 'border-2');
    cardImg.classList.add('card-img-top', 'weather-icon');
    cardBody.classList.add('card-body');
    cardHdr.classList.add('card-title');

    // Set the data, both icon filename and timezone offset are picked from the response.
    cardImg.setAttribute('src', `https://openweathermap.org/img/w/${data.weather[0].icon}.png`);
    // Calculate the correct time based off of the timezone offset and returned UTC time. 
    // First do the unix time math, then multiply by 1000 to get milliseconds for new Date()
    cardHdr.textContent = new Date((data.dt + timeZoneOffset) * 1000).toLocaleDateString();
    cardTemp.textContent = `Temp: ${Math.ceil(data.temp.max)}°F`;
    cardWind.textContent = `Wind: ${data.wind_speed}MPH`;
    cardHumi.textContent = `Humidity: ${data.humidity}%`;


    // Add elements to card div and return the card.
    cardDiv.appendChild(cardImg);
    cardBody.appendChild(cardHdr);
    cardBody.appendChild(cardTemp);
    cardBody.appendChild(cardWind);
    cardBody.appendChild(cardHumi);

    cardDiv.appendChild(cardBody);

    return cardDiv;
}

// Function for generating 5 day weather forecast
var drawForecast = function (data) {
    forecastWeather.innerHTML = ''
    for (var i = 1; i <= 5; i++) {
        var card = createCard(data[i]);
        forecastWeather.appendChild(card);
    }

}

// Function for updating weather forecast display
var updateWeatherDisplay = function (data, cityName) {
    timeZoneOffset = data.timezone_offset;
    drawCurrent(data.current, cityName);
    drawForecast(data.daily);
}

// Function to populate list of previously searched forecasts
var updateSideNav = function () {
    // Sorting the history alphabetically for easier reading.
    cityArray.sort();
    sideNav.innerHTML = '';
    for (var i = 0; i < cityArray.length; i++) {
        var element = document.createElement('li');
        element.classList.add('d-flex', 'pb-1');
        var button = document.createElement('button');
        // var deleteBtn = document.createElement('button');
        // deleteBtn.classList.add('btn', 'btn-outline-danger', 'w-25', 'delete');
        // deleteBtn.innerHTML = 'X';
        button.textContent = cityArray[i];
        button.classList.add('btn', 'btn-primary', 'w-100');
        element.appendChild(button);
        // element.appendChild(deleteBtn);
        sideNav.classList.add('custom-list');
        sideNav.appendChild(element);
    }
}

// Add event listeneres to the button clicks 
cityButton.addEventListener('click', cityButtonClick);
zipButton.addEventListener('click', zipButtonClick);

// Create the buttons for fast navigation back to previously searched data.
if (cityArray) {
    updateSideNav();
}

// Handle enter key press the same way as clicking the get forecast button.
var handleEnter = function(event) {
    if (event.keyCode === 13) {
        forecastSearch();
    }
}

// Add event listeneres for the enter clicks
cityInput.addEventListener('keyup', handleEnter);

// Show the forecast on app load 
var init = function() {
    if (currentCity) {
        if(isNaN(currentCity)) {
            getWeatherData(currentCity);
        } else {
            getWeatherData(Number(currentCity));
        }
    }
}

// Initiate the function above
init();


