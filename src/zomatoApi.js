/*
	This file perform HTTP requests
	to the Zomato API.
*/

/*
  + Categories -- done
  + Cities
  + Restaurant info:
    - name
    - locality
    - cuisine
    - rating
*/

// import request from 'request'

// Zomato API config
// const api = request.defaults({
// 	baseUrl: "https://developers.zomato.com/api/v2.1/",
// 	headers: {
// 		"Accept": "application/json",
// 		"Content-Type": "application/x-www-form-urlencoded",
// 		"user-key": "3cbc6aa5382786211d52dc0a6c23bdbc"
// 	}
// });

const getCategories = () => {
	return fetch("https://developers.zomato.com/api/v2.1/categories", {
		method: 'GET',
		headers: {
			"Accept": "application/json",
			"Content-Type": "application/x-www-form-urlencoded",
			"user-key": "3cbc6aa5382786211d52dc0a6c23bdbc"
		}
	})
	.then(response => {
		return response.json();
	})
	.then(data => {
		// console.log(data.categories[0].categories);
		return data.categories[0].categories;
	})
	.catch(err => {
		console.log(err);
	})
}

export default getCategories;