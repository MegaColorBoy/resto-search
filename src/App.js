/*
  Author: Abdush Shakoor Mohamed Nazeer
  To: Blue Logic Digital Agency
  Assignment: Restaurant Search Application
*/

import React from 'react';
import restoheader from './images/resto-header.jpg';
import uuid from 'uuid';
import './App.scss';

const apiConfig = {
  method: 'GET',
  headers: {
    "Accept": "application/json",
    "Content-Type": "application/x-www-form-urlencoded",
    "user-key": "3cbc6aa5382786211d52dc0a6c23bdbc"
  }
}

class RestoSearch extends React.Component {
  state = {
    searchResults: [],
    sortOrder: 'desc',
    isLoaded: false,
    location: {
      coords: {
        lat: 0,
        lon: 0
      },
      entity_type: '',
      entity_id: 0,
      city_id: 0,
      country_id: 0,
      city_name: '',
      country_name: '',
    },
    cities: [],
    cuisines: [],
    categories: [],
  };

  //Event handler for keyword-based search
  handleSearchSubmit = (obj) => {
    this.fetchSearchResults(obj.keyword);
  }

  //Event handler for filtered search
  handleFilterSubmit = (obj) => {

    let attrs = {
      entity_type: this.state.location.entity_type,
      entity_id: this.state.location.entity_id,
    }

    let cuisine_ids = [...obj.selectedCuisines];
    let category_ids = [...obj.selectedCategories];

    if(cuisine_ids.length !== 0) {
      attrs['cuisine_ids'] = cuisine_ids;
    }

    if(category_ids.length !== 0) {
      attrs['category_ids'] = category_ids;
    }

    this.fetchResultsBasedOnCuisines(attrs);
  }

  fetchResultsBasedOnCuisines = (attrs) => {

    //Query Settings
    let qs = {
      entity_type: attrs.entity_type,
      entity_id: attrs.entity_id,
      start: 0,
      count: 10
    };

    let query = `entity_id=${qs.entity_id}&entity_type=${qs.entity_type}&start=${qs.start}&count=${qs.count}`;


    if('cuisine_ids' in attrs) {
      qs['cuisines_str'] = attrs.cuisine_ids.join('%2C');
      query += `&cuisines=${qs.cuisines_str}`;
    }

    if('category_ids' in attrs) {
      qs['categories_str'] = attrs.category_ids.join(' ');
      query += `&category=${qs.categories_str}`;
    }

    fetch(`https://developers.zomato.com/api/v2.1/search?${query}`, apiConfig)
    .then(res => res.json())
    .then(data => {
      this.setState({searchResults: data.restaurants, isLoaded: true})
    });
  }

  //Fetch Search Results based on keyword
  fetchSearchResults = (word) => {
    //Query Settings
    let qs = {
      entity_type: "city",
      keyword: word,
      start: 0,
      count: 10,
      sort: "rating"
    };

    let query = `entity_type=${qs.entity_type}&q=${qs.keyword}&start=${qs.start}&count=${qs.count}&sort=${qs.sort}`;
    
    fetch(`https://developers.zomato.com/api/v2.1/search?${query}`, apiConfig)
    .then(res => res.json())
    .then(data => {
      this.setState({searchResults: data.restaurants, isLoaded: true})
    });
  }

  //Get geolocation of device
  fetchCurrentData = () => {
    navigator.geolocation.getCurrentPosition(position => {
      this.fetchGeoLocationDetails(position.coords)
    }, err => console.log(err));
  }

  /*
    This method will fetch the following:
    - coordinates i.e. longitude and latitude
    - nearby restaurants
    - current city and country

    Afterwards, it will fetch categories and cuisines based
    on locality.
  */
  fetchGeoLocationDetails = (coords) => {
    let lat = coords.latitude;
    let lon = coords.longitude;

    let query = `lat=${lat}&lon=${lon}`;
    
    fetch(`https://developers.zomato.com/api/v2.1/geocode?${query}`, apiConfig)
    .then(res => res.json())
    .then(data => {
      console.log(data);
      this.setState({
        location: {
          coords: {
            lat: lat,
            lon: lon
          },
          entity_id: data.location.entity_id,
          entity_type: data.location.entity_type,
          city_id: data.location.city_id,
          country_id: data.location.country_id,
          city_name: data.location.city_name,
          country_name: data.location.country_name,
        },
        searchResults: data.nearby_restaurants,
        isLoaded: true
      });

      this.fetchCategories();
      this.fetchLocalCuisines(query);
      this.fetchCities(query);
    });
  }

  fetchCities = (query) => {
    fetch(`https://developers.zomato.com/api/v2.1/cities?${query}`, apiConfig)
    .then(res => res.json())
    .then(data => {
      this.setState({
        cities: data.location_suggestions
      });
    });
  }

  // This method fetches categories
  fetchCategories = () => {
    fetch(`https://developers.zomato.com/api/v2.1/categories`, apiConfig)
    .then(res => res.json())
    .then(data => {
      this.setState({
        categories: data.categories
      });
    });
  }

  //This method fetches cuisines based on locality
  fetchLocalCuisines = (query) => {
    fetch(`https://developers.zomato.com/api/v2.1/cuisines?${query}`, apiConfig)
    .then(res => res.json())
    .then(data => {
      this.setState({
        cuisines: data.cuisines  
      });
    });
  }

  //Sort the result order by rating
  handleSortByRating = () => {
    let sortedResults = [];
    let newSortOrder = '';

    if(this.state.sortOrder === 'desc') {
      sortedResults = this.state.searchResults.sort((a,b) => (
        a.restaurant.user_rating.aggregate_rating - b.restaurant.user_rating.aggregate_rating
      ));
      newSortOrder = 'asc';

    }
    else {
      sortedResults = this.state.searchResults.sort((a,b) => (
        b.restaurant.user_rating.aggregate_rating - a.restaurant.user_rating.aggregate_rating
      ));
      newSortOrder = 'desc';
    }

    this.setState({
      searchResults: sortedResults,
      sortOrder: newSortOrder
    });
  }

  componentDidMount() {
    this.fetchCurrentData();
  }

  render() {
    let {cities, cuisines, categories, searchResults, isLoaded} = this.state;

    return (
      <div className="restosearch-main">
        <div className="intro" style={{backgroundImage: 'url(' + restoheader + ')'}}>
          <div className="container">
            <h1>RestoSearch</h1>
            <p>Find the best restaurants, cafes, and bars in UAE</p>
            <SearchContainer 
              onFormSubmit={this.handleSearchSubmit}
              cities={cities}
            />
          </div>
        </div>
        <div className="container body">
          <FilterBox 
            cuisines={cuisines}
            categories={categories}
            onFormSubmit={this.handleFilterSubmit}
            sortByRating={this.handleSortByRating}
          />
          <ResultList 
            restaurants={searchResults}
            isLoaded={isLoaded}
          />
        </div>
        
      </div>
    );
  }
}

class FilterBox extends React.Component {

  state = {
    sortButtonText: 'Asc',
    sortButtonClass: 'sort-amount-down'
  }

  //Submit event
  handleSubmit = () => {
    this.props.onFormSubmit({
      selectedCuisines: this.selectedCuisines,
      selectedCategories: this.selectedCategories
    });
  }

  checkIfValueExists = (set, value) => {
    if(set.has(value)) {
      set.delete(value);
    }
    else {
      set.add(value);
    }
  }

  toggleCheckbox = (obj) => {
    switch(obj.boxtype) {
      case "cuisine":
        this.checkIfValueExists(this.selectedCuisines, obj.value);
        break;

      case "category":
        this.checkIfValueExists(this.selectedCategories, obj.value);
        break;

      default:
        break;
    }
  }

  handleRatingSort = () => {
    
    let newSortButtonText = '';
    let newSortButtonClass = '';

    if(this.state.sortButtonText === 'Asc') {
      newSortButtonText = 'Desc';
      newSortButtonClass = 'sort-amount-up';
    }
    else {
      newSortButtonText = 'Asc';
      newSortButtonClass = 'sort-amount-down';
    }

    this.setState({sortButtonText: newSortButtonText, sortButtonClass: newSortButtonClass});
    this.props.sortByRating();
  }

  componentWillMount() {
    this.selectedCuisines = new Set();
    this.selectedCategories = new Set();
  }

  render() {
    const cuisinesList = this.props.cuisines.slice(0,5).map((item) => (
      <CheckBox 
        key={"cuisines-" + uuid.v4()}
        boxtype={"cuisine"}
        title={item.cuisine.cuisine_name}
        value={item.cuisine.cuisine_id}
        handleCheckboxChange={this.toggleCheckbox}
      />
    ));

    const categoriesList = this.props.categories.slice(0,5).map((item) => (
      <CheckBox
        key={"categories-" + uuid.v4()}
        boxtype={"category"}
        title={item.categories.name}
        value={item.categories.id}
        handleCheckboxChange={this.toggleCheckbox}
      />
    ));

    return (
      <div className="filterBox">
        <h3>Filtered Search</h3>
        <div className="__section">
          <button 
            className="button button-secondary" 
            onClick={this.handleRatingSort}
          >
            {this.state.sortButtonText}
            <i 
              style={{left: "10px", position: "relative"}}
              className={"fas fa-" + this.state.sortButtonClass}
            ></i>
          </button>
        </div>
        <div className="__section">
          <div className="__title">
            <h5>Cuisines</h5>
          </div>
          <ul className="checkboxList">{cuisinesList}</ul>
        </div>
        <div className="__section">
          <div className="__title">
            <h5>Categories</h5>
          </div>
          <ul className="checkboxList">{categoriesList}</ul>
        </div>
        <div className="__section">
          <button className="button button-primary" onClick={this.handleSubmit}>Search</button>
        </div>
      </div>
    );
  }
}

class CheckBox extends React.Component {
  
  state = {
    isChecked: false,
  }

  toggleCheckboxChange = () => {
    this.setState(({isChecked}) => (
      {
        isChecked: !isChecked
      }
    ));

    this.props.handleCheckboxChange({boxtype: this.props.boxtype, value: this.props.value});
  }

  render() {
    return (
      <li>
        <label className="checkbox">
          <div>
            <input 
              type="checkbox" 
              className={this.props.boxtype} 
              value={this.props.value}
              onChange={this.toggleCheckboxChange}
              checked={this.state.isChecked}
            />
            <span className="checkmark"></span>
          </div>
          <div>
            <p>{this.props.title}</p>
          </div>
        </label>
      </li>
    );
  }
}

//SearchContainer component
class SearchContainer extends React.Component {

  state = {
    keyword: '',
    city: ''
  };

  //Submit event
  handleSubmit = () => {
    this.props.onFormSubmit({
      keyword: this.state.keyword
    });
    console.log(this.props.onFormSubmit);
  }

  //Event handler for search input box
  handleSearchInputChange = (e) => {
    this.setState({keyword: e.target.value});
  }

  //Event handler for key press
  keyPressed = (e) => {
    if(e.which === 13) {
      this.handleSubmit();
    }
  }

  handleCityDropdownChange = (e) => {
    console.log(e.value);
  }

  render() {
    const citiesList = this.props.cities.map((item) => (
      <option 
        key={"cities-" + uuid.v4()}
      >
      {item.name}
      </option>
    ));
    return (
      <div className="container search-container">
        <div className="searchDropdown-wrapper">
          <select className="dropdown">
            {citiesList}
          </select>
        </div>
        <div className="searchbar-wrapper">
          <div className="input-icon">
            <i className="fas fa-search"></i>
          </div>
          <input 
            type="text" 
            onChange={this.handleSearchInputChange}
            onKeyPress={this.keyPressed}
            value={this.state.keyword}
            placeholder="Search for restaurants or cuisines..." 
          />
        </div>
        <div className="searchButton-wrapper">
          <button 
            className="button button-primary"
            onClick={this.handleSubmit}
          >
            Search
          </button>
        </div>
      </div>
    );
  }
}

//This component displays the list of restaurants
class ResultList extends React.Component {
  render() {

    let restaurants = this.props.restaurants;
    let isLoaded = this.props.isLoaded;

    if(isLoaded) {
      const resultComponents = restaurants.map((item) => (
        <ResultCard 
          key={"result-" + uuid.v4()}
          title={item.restaurant.name}
          cuisines={item.restaurant.cuisines}
          location={item.restaurant.location.address}
          rating={item.restaurant.user_rating.aggregate_rating}
          thumbnail={item.restaurant.thumb}
        />
      ));

      return (
        <div className="resultList">
          {resultComponents}
        </div>
      );
    }
    else {
      return(
        <div className="container">
          <p>Please wait...</p>
        </div>
      );
    }

  }
}

//This component displays the restaurant information
class ResultCard extends React.Component {
  render() {
    return (
      <div className="resultCard">
        <div className="img" style={{backgroundImage: 'url(' + this.props.thumbnail + ')'}}></div>
        <div className="content">
          <div className="details">
            <h3>{this.props.title}</h3>
            <h5><i className="fas fa-utensils"></i>{this.props.cuisines}</h5>
            <h6><i className="fas fa-map-marker-alt"></i>{this.props.location}</h6>
          </div>
          <div>
            <p className="rating">{this.props.rating}</p>
          </div>
        </div>
      </div>
    );
  }
}

function App() {
  return (
    <div className="App">
      <RestoSearch />
    </div>
  );
}

export default App;