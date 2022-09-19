'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  data = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    // this.data=
    // this.id=
    this.coords = coords; // latitude , longitude
    this.distance = distance; // in km
    this.duration = duration; // in minutes
  }
}

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

/////////////////////////////////////////
// Application Architecture
class App {
  #map;
  #mapEvent;
  #workouts = [];
  constructor() {
    this._getPosition();

    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Couldn't get your location");
        }
      );
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _toggleElevationField() {}

  _isValidInput(...numbers) {
    for (let i = 0; i < numbers.length; i++) {
      if (!Number.isFinite(numbers[i])) return false;
    }
    return true;
  }

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
    // Check is data is valid

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

      // guard class
      if (
        !this._isValidInput(elevationGain, duration, distance) ||
        !isPositiveInput(duration, distance)
      ) {
        return alert('Input should be positive numbers');
      }
      const workout = new Running(
        [lat, lng],
        distance,
        duration,
        elevationGain
      );
    }
    this.#workouts.push(workout);
    console.log(workout);
    // Add new object to workout array

    // Render workout on map as marker

    // render workout on list

    // hide form + clear input field
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';
    //display the marker
    this.renderWorkoutMarker(lat, lng, type);
  }
  renderWorkoutMarker(lat, lng, type) {
    L.marker([lat, lng])
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
      .setPopupContent('Workout')
      .openPopup();
  }
}

const app = new App();
