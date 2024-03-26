//Environment info
const fs = require('fs');
const platformClient = require('purecloud-platform-client-v2');
const client = platformClient.ApiClient.instance;
client.config.setConfigPath('C:\Git\GenesysCloudCX-bulkDeletion\config\config');
client.setEnvironment(platformClient.PureCloudRegionHosts.eu_west_2);

//oAuth details, these should be added to your system as an environment variable
clientId = process.env.GENESYS_CLIENT_ID
clientSecret = process.env.GENESYS_CLIENT_SECRET

// Create API instances
const authorizationApi = new platformClient.AuthorizationApi();
const usersApi = new platformClient.usersApi();

//define options to get skills
let skillOpts = {
  'pageSize': 100, // Number | Page size
  'pageNumber': 1, // Number | Page number
  'sortOrder': "ASC" // String | Ascending or descending sort order
};

let opts = {
  'pageSize': 25, // Number | Page size
  'pageNumber': 1 // Number | Page number
};

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

const exportCsv = [
];



//login
client.loginClientCredentialsGrant(clientId, clientSecret)
  .then(() => {
    console.log("Authed")

    //get users
    usersApi.getUsers(opts)
      .then((data) => {

        //loop through each user
        data.entities.forEach(function (user) {

          //get skills for the user
          usersApi.getUserRoutingskills(user.id, skillOpts)
            .then((dataSkills) => {

              //print out the user detail
              console.log(user.id);
              console.log(user.name);
              //console.log(`getUserRoutingskills success! data: ${JSON.stringify(dataSkills, null, 2)}`);

              //loop through the skills and print them out
              dataSkills.entities.forEach(function (skill) {
                console.log(skill.name)

                //here is where we want to begin the export
                var jsonObj = {"id":user.id, "name:":user.name, "skill1":skill.name}
                exportCsv.push(jsonObj);
                
                // Convert data to CSV
                const csv = convertToCSV(exportCsv);

                // Write CSV to a file
                fs.writeFileSync('exportCsv.csv', csv);

              });
            })

            .catch((err) => {
              console.log('There was a failure calling getUserRoutingskills');
              console.error(err);
            });
        });
      })

      .catch((err) => {
        console.log('There was a failure calling getUsers');
        console.error(err);
      });
  })

  .catch((err) => {
    // Handle failure response
    console.log(err);
  });