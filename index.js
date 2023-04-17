const core = require('@actions/core');
const github = require('@actions/github');
const fs = require("fs");
const async = require('async');
const fs = require('fs');
const https = require('https');
const path = require("path");
const createReadStream = require('fs').createReadStream
const sleep = require('util').promisify(setTimeout);
const ComputerVisionClient = require('@azure/cognitiveservices-computervision').ComputerVisionClient;
const ApiKeyCredentials = require('@azure/ms-rest-js').ApiKeyCredentials;







const computerVisionClient = new ComputerVisionClient(
    new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': key } }), endpoint);

function computerVision(key, endpoint) {
    async.series([
        async function () {
            // Image of different kind of dog.
            const tagsURL = 'https://moderatorsampleimages.blob.core.windows.net/samples/sample16.png';
            // Analyze URL image
            console.log('Analyzing tags in image...', tagsURL.split('/').pop());
            const captions = (await computerVisionClient.analyzeImage(tagsURL, { visualFeatures: ['Description'] })).description.captions[0].text;
            return(captions.split(' ').join('-'));
        },
        function () {
            return new Promise((resolve) => {
                resolve();
            })
        }
    ], (err) => {
        throw (err);
    });
}











const main = async () => {
    const owner = core.getInput('owner', { required: true });
    const repo = core.getInput('repo', { required: true });
    const token = core.getInput('token', { required: true });
    const ref = core.getInput('ref', { required: true });
    const sha = core.getInput('sha', { required: true });
    const key = core.getInput('key', { required: true });
    const endpoint = core.getInput('endpoint', { required: true });
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
    


    tree.forEach(async (element) => {
        // get content of markdown files
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
            const content = Buffer.from(file.data.content, 'base64').toString('utf8');

            // get index of markdown images that do not contain alt text
            const regex = /!\(/gi;
            let result, indices = [];
            while ((result = regex.exec(content))) {
                indices.push(result.index);
            }
            // push to array url
            let arr = []
            for (let i = 0; i < indices.length; i++) {
                arr.push(content.substring(indices[i] + 2, indices[i + 1]).split(")")[0]);
            }
        }
    });
    await octokit.request('POST /repos/{owner}/{repo}/check-runs', {
        owner: owner,
        repo: repo,
        name: 'Markdown image alt text checker',
        head_sha: sha,
        status: 'completed',
        conclusion: 'failure',
        output: {
            title: 'Markdown image missing alt text',
            summary: 'Add alt text to image',
            text: '',
            annotations: [
                {
                    path: tree[2].path,
                    start_line: 1,
                    end_line: 1,
                    annotation_level: 'failure',
                    message: 'Markdown image missing alt text',
                    start_column: 1,
                    end_column: 1
                }
            ]
        },
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        }
    });

    const altText = computerVision(key, endpoint);
    core.info(altText)
}
(async () => {
    try {
        await main();
    } catch (error) {
        core.setFailed(error.message);
    }
})();