const core = require('@actions/core');
const github = require('@actions/github');
const azure = require("./azure");

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
    // const mdFileArr = [];

    const promises = tree.map(async (element) => {
        const path = element.path;
        const fileType = path.split('.').pop();
        if (fileType.toLowerCase() === "md") {
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
            const regex = /!\[\]\(/gi;
            let result, indices = [];
            while ((result = regex.exec(content))) {
                indices.push(result.index);
            }
            if (indices.length > 0) {
                // push to array url
                let mdFile = { path: element.path, urlArr: [] }
                for (let i = 0; i < indices.length; i++) {
                    mdFile.urlArr.push(content.substring(indices[i] + 4, indices[i + 1]).split(")")[0]);
                }
                return (mdFile);
            }
        }
    });

    const mdFileArr = await Promise.all(promises);
    mdFileArr = mdFileArr.filter((element) => {
        return element !== undefined;
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
                    path: mdFileArr[0].path,
                    start_line: 2,
                    end_line: 4,
                    annotation_level: 'failure',
                    message: 'Markdown image missing alt text',
                    start_column: 3,
                    end_column: 4
                }
            ]
        },
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        }
    })

    console.log(mdFileArr);


    // azure.computerVision(key, endpoint).then((suggestedText) => { console.log(suggestedText) })
    // core.info(altText)
}
(async () => {
    try {
        await main();
    } catch (error) {
        core.setFailed(error.message);
    }
})();