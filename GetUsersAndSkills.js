//Environment info
const fs = require('fs');
//const { createObjectCsvWriter } = require('csv-writer');
const platformClient = require('purecloud-platform-client-v2');
const client = platformClient.ApiClient.instance;
client.config.setConfigPath('C:\Git\GenesysCloudCX-bulkDeletion\config\config');
client.setEnvironment(platformClient.PureCloudRegionHosts.eu_west_2);

//oAuth details, these should be added to your system as an environment variable
clientId = process.env.GENESYS_CLIENT_ID
clientSecret = process.env.GENESYS_CLIENT_SECRET

// Create API instances
const authorizationApi = new platformClient.AuthorizationApi();
const usersApi = new platformClient.UsersApi();

//define options to get skills
let skillOpts = {
  'pageSize': 100, // Number | Page size
  'pageNumber': 1, // Number | Page number
  'sortOrder': "ASC" // String | Ascending or descending sort order
};

let opts = {
  'pageSize': 100, // Number | Page size
  'pageNumber': 1 // Number | Page number
};

// Define a sleep function that returns a promise
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

//------------------------- 

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


  // .then(() => {
  //   //get users
  //   usersApi.getUsers(opts)
  //     .then((data) => {
  //       console.log(`get user success! data: ${JSON.stringify(data, null, 2)}`);
  //       data.entities.forEach(async function (user) {
  //         usersApi.getUserRoutinglanguages(user.id, skillOpts)  //get language skills for the user
  //           .then((languageData) => {
  //             languageData.entities.forEach(async function (skill) {  //loop through each skill and add to array
  //               var jsonObj = { "id": user.id, "name:": user.name, "skill": skill.name, "skillproficiency": skill.proficiency }
  //               exportCsv.push(jsonObj);
  //             })
  //           })
  //           .catch((err) => {
  //             console.log('There was a failure calling getUserRoutinglanguages');
  //             console.error(err);
  //           });
  //       });

  //       //loop through each user
  //       data.entities.forEach(async function (user) {
  //         //get skills for the user
  //         usersApi.getUserRoutingskills(user.id, skillOpts)
  //           .then((dataSkills) => {
  //             dataSkills.entities.forEach(async function (skill) {
  //               var jsonObj = { "id": user.id, "name:": user.name, "skill": skill.name, "skillproficiency": skill.proficiency }
  //               exportCsv.push(jsonObj);
  //               // Convert data to CSV
  //               const csv = convertToCSV(exportCsv);
  //               // Write CSV to a file
  //               fs.writeFileSync('exportCsv.csv', csv);
  //             });
  //           })
  //           .catch((err) => {
  //             console.log('There was a failure calling getUserRoutingskills');
  //             console.error(err);
  //           });
  //       });
  //     })
  //     .catch((err) => {
  //       console.log('There was a failure calling getUsers');
  //       console.error(err);
  //     });
  // })
  //   .catch((err) => {
  //     // Handle failure response
  //     console.log(err);
  //   });
}


let exportCsv = [];
main();


