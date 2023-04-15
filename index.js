const core = require('@actions/core');
const github = require('@actions/github');
const fs = require("fs");
const { connected } = require('process');
const fetch = require("node-fetch");

async function checkFileExistence(path) {
    return fs.promises.access(path, fs.constants.F_OK)
        .then(() => {
            core.info(`${path} exists`);
            return true;
        })
        .catch(() => {
            core.setFailed(`${path} does not exist`);
            return false;
        });
}

// create a function that checks if the file starts with a markdown header
async function checkFileStartsWithHeader(filePath) {
    return fs.promises.readFile(filePath, 'utf8')
        .then(fileContent => {

            // remove all empty lines ad the beginning of the file
            fileContent = fileContent.replace(/^\s*\n/gm, '');

            if (fileContent.startsWith('#')) {
                core.info(`File ${filePath} starts with a header`);
                return true;
            } else {
                core.setFailed(`File ${filePath} does not start with a header`);
                return false;
            }
        });
}
// function that recursively finds markdown files in entre repository

function getAllFiles(dir, allFilesList = []) {
    core.info(dir);
    const files = fs.readdirSync(dir);
    files.map(file => {
        const name = dir + '/' + file;
        if (fs.statSync(name).isDirectory()) { // check if subdirectory is present
            getAllFiles(name, allFilesList);     // do recursive execution for subdirectory
        } else {
            allFilesList.push(name);           // push filename into the array
            core.info(name);
        }
    })

    return allFilesList;
}




const main = async () => {
    const owner = core.getInput('owner', { required: true });
    const repo = core.getInput('repo', { required: true });
   // const pr_number = core.getInput('pr_number', { required: true });
    const token = core.getInput('token', { required: true });
    const octokit = new github.getOctokit(token);


    var myHeaders = new fetch.Headers();
    myHeaders.append("Authorization", "Bearer " + token);
    var requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
    };
    const arr = []
    core.info(token);
    fetch("https://api.github.com/repos/" + owner + "/"+ repo +"/git/trees/master?recursive=1", requestOptions)
        .then(response => response.json())
        .then(result => {
            core.info(result.tree);
            result.tree.forEach(element => {
                arr.push(element);
            });
            
        })
        .catch(error => console.log('error', error));


    const { data: changedFiles } = await octokit.rest.pulls.listFiles({
        owner,
        repo,
        // pull_number: pr_number,
    });

    await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
        owner: 'OWNER',
        repo: 'REPO',
        path: 'PATH',
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        }
    });
    for (const file of changedFiles) {
        /**
         * Add labels according to file types.
         */
        // core.info(file);
        // const fileExtension = file.filename.split('.').pop();
        // switch (fileExtension) {
        //     case 'md':
        //         await octokit.rest.issues.addLabels({
        //             owner,
        //             repo,
        //             issue_number: pr_number,
        //             labels: ['markdown'],
        //         });
        // }
    }
}
(async () => {
    try {
        await main();
        // getAllFiles(repo);
        // checkFileExistence("README.md");
        // checkFileExistence("LICENSE");
        // checkFileStartsWithHeader("README.md");
    } catch (error) {
        core.setFailed(error.message);
    }
})();



// function that recursively finds markdown files in entre repository
// function that checks content of file and finds image tags with no alttext field