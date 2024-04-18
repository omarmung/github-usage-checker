const https = require('https');


// HELPERS

// get some json from a URL
async function fetchJSON(url, headers = {}) {
	return new Promise((resolve, reject) => {
	  const options = {
		headers,
	  };
  
	  https.get(url, options, (res) => {
		let data = '';
  
		res.on('data', (chunk) => {
		  data += chunk;
		});
  
		res.on('end', () => {
		  try {
			// console.log(data);
			const jsonData = JSON.parse(data);
			resolve(jsonData);
		  } catch (error) {
			reject(error);
		  }
		});
	  }).on('error', (error) => {
		reject(error);
	  });
	});
  }


// Set the user agent header
// Get a Bearer token by going to https://github.com/settings/personal-access-tokens 
//  and creating a new token, and replace it below like so: 'Authorization': 'Bearer sdfljsfldkjsdflksdjflsdkjflsdkfj'
const headers = {
	'User-Agent': 'request',
	'Accept': 'application/vnd.github+json',
	'Authorization': 'Bearer <REPLACE THIS WITH YR TOKEN>',
	'X-GitHub-Api-Version': '2022-11-28'
};

// Get command line argument(s)
const githubUsername = process.argv[2];

// construct URLs
const githubUrlUser = 	'https://api.github.com/users/' + githubUsername;
const githubUrlRepos = 	'https://api.github.com/users/' + githubUsername + '/repos';

// control logic
  var main = async function() {
	try {
		// call 1: get github user data
		let jsonData = await fetchJSON(githubUrlUser, headers);
		await processGithubUserCall(jsonData);

		// call 2: get github repo data
		let jsonData2 = await fetchJSON(githubUrlRepos, headers);
		const repoNames = await processGithubReposCall(jsonData2);
		//console.log("repoNames: ", repoNames);

		// call 3: get commits data
		let commitData = await Promise.all(repoNames.map(async (repoName) => {
			const githubCommitsPerRepo = await fetchJSON(`https://api.github.com/repos/${githubUsername}/${repoName}/commits`, headers);
			var obj = {
				name: repoName, // commits: githubCommitsPerRepo,
				commitsCount: githubCommitsPerRepo.length
			};
			return obj;
		})); 
		// boil down the commit data to a single number
		var totalCommits = commitData.reduce((acc, curr) => { return acc + curr.commitsCount; }, 0);
		console.log("totalCommits:     ", totalCommits);


		// add an extra line for readability
		console.log("");

	} catch (error) {
		console.error('Error:', error);
	}
  }();

// views
var processGithubUserCall = async userData => {

	// Process the data from the response body
	// console.log("userData: ", userData);
	// number of milliseconds in a day
	var oneDay = 24*60*60*1000;

	var recencyPeriodInDays = 4;
	var createdAt = new Date(userData.created_at);
	//console.log("now:            ", new Date(Date.now()));
	var daysOnPlatform = " " + Math.round((new Date(Date.now()) - createdAt) / oneDay);
	console.log("daysOnGithub:    ", daysOnPlatform);
	console.log("created:          ", createdAt);
											// date delta in millis                  // number of millis in recency period
	// console.log("createdRecently:", ((new Date(Date.now()) - createdAt) ) <= recencyPeriodInDays * oneDay);
};

var processGithubReposCall = async reposData => {

	// Process the data from the response body

	// Get the names of the repos	
	var repoNames = reposData.map(repo => {
		return repo.full_name.split("/")[1];
	});

	// Check if any of the repo names contain the word "proxy"
	var doRepoNamesContainProxy = repoNames.some(name => {
		return /proxy/i.test(name);
	});
	console.log("hasProxy:         ", doRepoNamesContainProxy);

	// Check if any of the repo names contain the word "clone"
	var doRepoNamesContainClone = repoNames.some(name => {
		return /clone/i.test(name);
	});

	console.log("hasClone:         ", doRepoNamesContainClone);

	// Check if any of the repo names contain the word "netflix" or "airbnb"
	var doRepoNamesContainBrands = repoNames.some(name => {
		// Create an array of brand names to check for
		const brandNamesList = ['Netflix', 'AirBnB'];

		// Create a regular expression pattern for each brand name with case-insensitive matching
		const brandRegexes = brandNamesList.map(brand => new RegExp(brand, 'i'));
	
		// Use the some method to check if any brand name matches the repository name
		return brandRegexes.some(regex => regex.test(name));
	});
	console.log("hasBrands:        ", doRepoNamesContainBrands);

	return repoNames;
};
