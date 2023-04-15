const core = require('@actions/core');
const github = require('@actions/github');
const fs = require("fs");
const { connected } = require('process');

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
    const ref = core.getInput('ref', { required: true });
    const octokit = new github.getOctokit(token);

    const result = await octokit.request('GET /repos/{owner}/{repo}/git/trees/{tree_sha}?recursive={recursive}', {
        owner: owner,
        repo: repo,
        tree_sha: ref,
        recursive: 'true',
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        }
    });
    const tree = result.data.tree;
    core.info(JSON.stringify(tree[1]));
    tree.forEach(async (element) => {
        const path = element.path;
        const fileType = path.split('.').pop();
        if (fileType.toLowerCase() === "md") {
            core.info(path);
            const file = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
                owner: owner,
                repo: repo,
                path: path,
                headers: {
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            });
            var buff = Buffer.from(file.data.content, 'base64').toString('utf8')     ;
            core.info(buff);
        }
    });

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