const core = require('@actions/core');
const github = require('@actions/github');
const azure = require("./azure");

const main = async () => {
    const owner = core.getInput('owner', { required: true });
    const repo = core.getInput('repo', { required: true });
    const token = core.getInput('token', { required: true });
    const ref = core.getInput('ref', { required: true });
    const sha = core.getInput('sha', { required: true });
    const key = "";
    const endpoint = "";
    try {
        key = core.getInput('key', { required: false });
        endpoint = core.getInput('endpoint', { required: false });
    } catch { }
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
            const contentArr = content.split('\n')
            let rowArr = []
            for (let i = 0; i < contentArr.length; i++) {
                console.log(contentArr[i])
                const syntax = "![]";
                let index = contentArr[i].indexOf(syntax);
                while (index != -1) {
                    console.log(index)
                    rowArr.push(i)
                    index = contentArr[i].indexOf(syntax, index + 1);
                }
            }
            console.log(rowArr)
            let mdFile = [];
            for (let i = 0; i < rowArr.length; i++) {
                const lineContent = contentArr[rowArr[i]]
                const regex = /!\[\]/gi;
                let result;
                while ((result = regex.exec(lineContent))) {
                    const pos = result.index;
                    const url = lineContent.substring(pos + 4).split(")")[0];
                    let mdError = {
                        path: element.path,
                        annotation_level: 'warning',
                        title: 'Markdown Image Alt-text Checker',
                        message: 'Missing alt-text for image ' + url + ' on line ' + (rowArr[i] + 1).toString() + '.',
                        start_line: rowArr[i] + 1,
                        end_line: rowArr[i] + 1,
                    }
                    if (key !== "" && endpoint !== "") {
                        await azure.computerVision(key, endpoint, url).then((suggestedText) => {
                            const updatedText = mdError.message + ' Suggested alt-text: ' + suggestedText;
                            mdError.message = updatedText;
                        })
                    }
                    mdFile.push(mdError);
                }
                return (mdFile);
            }
        }
    });

    let mdFileArr = await Promise.all(promises);
    mdFileArr = mdFileArr.filter((element) => {
        return element !== undefined;
    });
    mdFileArrFlatten = [].concat.apply([], mdFileArr)
    if (mdFileArrFlatten.length > 0) {
        await octokit.request('POST /repos/{owner}/{repo}/check-runs', {
            owner: owner,
            repo: repo,
            name: '![Exclamation Mark]',
            head_sha: sha,
            status: 'completed',
            conclusion: 'failure',
            output: {
                title: '![Exclamation Mark] GitHub Action Report',
                summary: 'There are ' + mdFileArrFlatten.length.toString() + ' warnings.',
                text: 'You may have some markdown files that contain images with missing alt-text',
                annotations: mdFileArrFlatten,
            },
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
            }
        })
    }
}
(async () => {
    try {
        await main();
    } catch (error) {
        core.setFailed(error.message);
    }
})();