'use strict';

// prettier-ignore
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

// the main class
class App {
  #map;
  #mapEvent;
  #workouts = [];
  constructor() {
    this._getPosition();

    this._getDataFromLocalStorage();

    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField.bind(this));
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  // get position on map
  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Couldn't get your location");
        }
      );
  }
  // load map from the api
  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));
    this.#workouts.forEach(work => {
      const type = work.cadence ? 'running' : 'cycling';
      this._renderWorkoutMarker(type, work);
    });
  }
  // show form of new workouts
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  // hide the form after completion
  _hideForm() {
    inputCadence.value =
      inputElevation.value =
      inputDuration.value =
      inputDistance.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1);
  }

  // toggling the fields cadence and elevartion gain
  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }
  // check that input is numbers
  _isValidInput(...numbers) {
    for (let i = 0; i < numbers.length; i++) {
      if (!Number.isFinite(numbers[i])) return false;
    }
    return true;
  }
  // adding new workout
  _newWorkout(e) {
    e.preventDefault();

    const isPositiveInput = function (...inputs) {
      for (let i = 0; i < inputs.length; i++) {
        if (inputs[i] <= 0) return false;
      }
      return true;
    };
    // Get Data From form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // If workout running, create running object

    if (type === 'running') {
      const cadence = +inputCadence.value;

      // guard class
      if (
        !this._isValidInput(cadence, duration, distance) ||
        !isPositiveInput(duration, distance, cadence)
      ) {
        return alert('Input should be positive numbers');
      }
      workout = new Running([lat, lng], distance, duration, cadence);
    }
    // If workout cycling, create cycling object
    else if (type === 'cycling') {
      const elevationGain = +inputElevation.value;
      console.log(inputElevation.value);
      // guard class
      if (
        !this._isValidInput(elevationGain, duration, distance) ||
        !isPositiveInput(duration, distance)
      ) {
        return alert('Input should be positive numbers');
      }
      workout = new Cycling([lat, lng], distance, duration, elevationGain);
    }
    this.#workouts.push(workout);

    // hide form + clear input field
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';

    //display the marker
    this._renderWorkoutMarker(type, workout);

    // render workout on list
    this._renderWorkout(workout, type);

    // hide form and show list

    this._hideForm();

    // add to local storage
    this._setLocalStorage();
  }
  _renderWorkoutMarker(type, workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${type}-popup`,
        })
      )
      .setPopupContent(
        ` ${workout instanceof Running ? '🏃‍♂️ ' : '🚴‍♀️ '}${workout.description}`
      )
      .openPopup();
  }
  // render workout on the page
  _renderWorkout(workout, type) {
    let html = `<li class="workout workout--${type}" data-id="${workout.id}">
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
        <span class="workout__icon">${workout.cadence ? '🏃‍♂️' : '🚴‍♀️'}</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>`;

    // check its running or cycling
    if (workout.cadence) {
      html += ` <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">spm</span>
    </div>
  </li>`;
    } else if (workout.elevationGain) {
      html += ` <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.speed.toFixed(1)}</span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workout.elevationGain}</span>
      <span class="workout__unit">m</span>
    </div>
  </li>`;
    }
    form.insertAdjacentHTML('afterend', html);
  }
  // moving to the location of workout on the map when pressing on it
  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');

    // guard class
    if (!workoutEl) return;
    const workout = this.#workouts.find(
      work => workoutEl.dataset.id === work.id
    );
    this.#map.setView(workout.coords, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }
  // adding objects to local storage
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }
  // getting the data from local storage
  _getDataFromLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach(work => {
      const type = work.cadence ? 'running' : 'cycling';
      this._renderWorkout(work, type);
    });
  }
  // resetting the local storage
  _reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords; // latitude , longitude
    this.distance = distance; // in km
    this.duration = duration; // in minutes
    this._setDateDescription();
  }
  // setting the description of a workout panel
  _setDateDescription() {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    this.description = this instanceof Running ? 'Running ' : 'Cycling ';
    this.description += `on ${
      months[this.date.getMonth()]
    } ${this.date.getDay()}`;
  }
}
// derived class from class workout of type running
class Running extends Workout {
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
  }
}
// derived class from workout class of type running
class Cycling extends Workout {
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
  }
}

const app = new App();

/****************note: all the app running on the app class */
