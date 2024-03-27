//Environment info
const fs = require('fs');
const platformClient = require('purecloud-platform-client-v2');
const client = platformClient.ApiClient.instance;
client.config.setConfigPath('C:\Git\GenesysCloudCX-bulkDeletion\config\config');
client.setEnvironment(platformClient.PureCloudRegionHosts.eu_west_2);   //change region as needed

//oAuth details, these should be added to your system as an environment variable
clientId = process.env.GENESYS_CLIENT_ID
clientSecret = process.env.GENESYS_CLIENT_SECRET

// Create API instances
const authorizationApi = new platformClient.AuthorizationApi();
const usersApi = new platformClient.UsersApi();

//define options for skills api call
let skillOpts = {
  'pageSize': 100, // Number | Page size
  'pageNumber': 1, // Number | Page number
  'sortOrder': "ASC" // String | Ascending or descending sort order
};

//define options for users api call
let opts = {
  'pageSize': 100, // Number | Page size
  'pageNumber': 1 // Number | Page number
};

// Define a sleep function that returns a promise
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

//function to write to csv
function convertToCSV(data) {
  // Create headers from the keys of the first object
  const headers = Object.keys(data[0]);

  // Create CSV string
  let csv = headers.join(',') + '\n';

  // Add data rows
  data.forEach(obj => {
    const row = headers.map(header => obj[header]);
    csv += row.join(',') + '\n';
  });

  return csv;
}


//main function which queries API
async function getSkillsAndLanguages(user) {
  console.log(new Date());

  const userLanguages = await usersApi.getUserRoutinglanguages(user.id, skillOpts)
  if (userLanguages.entities.length > 0) {
    userLanguages.entities.forEach(async (skill) => {  //loop through each skill and add to array
      const jsonObj = { "id": user.id, "name:": user.name, "skill": skill.name, "skillproficiency": skill.proficiency };
      exportCsv.push(jsonObj);
    })
  } else {
    const jsonObj = { "id": user.id, "name:": user.name, "skill": null, "skillproficiency": null };
    exportCsv.push(jsonObj);
  }

  const userSkills = await usersApi.getUserRoutingskills(user.id, skillOpts)
  if (userSkills.entities.length > 0) {
    userSkills.entities.forEach(async (skill) => {  //loop through each skill and add to array
      const jsonObj = { "id": user.id, "name:": user.name, "skill": skill.name, "skillproficiency": skill.proficiency };
      exportCsv.push(jsonObj);
    })
  } else {
    const jsonObj = { "id": user.id, "name:": user.name, "skill": null, "skillproficiency": null };
    exportCsv.push(jsonObj);
  }
}


async function getUsers() {
  let current = 0;
  let pageCount = 1;
  const entities = [];

  while (pageCount > current) {
    const opt = {
      pageNumber: current + 1,
      pageSize: 100
    };
    const data = await usersApi.getUsers(opt);
    if (data.pageCount) {
      pageCount = data.pageCount
    }
    entities.push(data.entities);
    current++;
  }
  return entities.flat(1);
}

async function main() {
  await client.loginClientCredentialsGrant(clientId, clientSecret);

  const users = await getUsers();

  for await (const user of users) {
    console.log({ user: user.name })
    try {
      await Promise.all([
        await getSkillsAndLanguages(user),
        sleep(2000),
      ])
    } catch (err) {
      console.error(err)
    }
  }
  const csvData = convertToCSV(exportCsv);
  fs.writeFileSync('skills.csv', csvData);
}
let exportCsv = [];
main();