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
            const contentArr = content.split('\n')
            let rowArr = []
            for (let i = 0; i < contentArr.length; i++) {
                if (contentArr[i].indexOf("![]") >= 0) rowArr.push(i)
            }
            let mdFile = [];
            for (let i = 0; i < rowArr.length; i++) {
                const lineContent = contentArr[rowArr[i]]
                const regex = /!\[\]/gi;
                let result;
                while ((result = regex.exec(lineContent))) {
                    // indices.push(result.index);
                    const pos = result.index;
                    const url = lineContent.substring(pos + 4).split(")")[0];
                    let mdError = {
                        path: element.path,
                        annotation_level: 'warning',
                        title: 'Markdown Image Checker',
                        message: 'Missing alt-text for image ' + url + ' on line ' + (rowArr[i] + 1).toString,
                        start_line: rowArr[i] + 1,
                        end_line: rowArr[i] + 1,
                        urlArr: []
                    }
                    if (1 == 1) {
                        await azure.computerVision(key, endpoint, 'https://moderatorsampleimages.blob.core.windows.net/samples/sample16.png').then((suggestedText) => {
                            mdError.raw_details = 'Suggested alt-text: ' + suggestedText;
                            console.log(suggestedText)
                        })
                        mdFile.push(mdError);
                    }
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
            name: 'Markdown image alt text checker',
            head_sha: sha,
            status: 'completed',
            conclusion: 'failure',
            output: {
                title: '![Exclamation Mark] GitHub Action Report',
                summary: 'There are ' + mdFileArrFlatten.length.toString() + ' warnings.',
                text: 'You may have some markdown files that contain images with missing alt-text',
                annotations: mdFileArrFlatten
                // [
                // {
                //     path: mdFileArr[0].path,
                //     start_line: 1,
                //     end_line: 1,
                //     annotation_level: 'failure',
                //     message: 'Markdown image missing alt text',
                // },
                // ]
                , images: [
                    {
                        alt: 'Super dog',
                        image_url: 'https://moderatorsampleimages.blob.core.windows.net/samples/sample16.png'
                    }
                ]
            },
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
            }
        })
    }
    // core.info(altText)
}
(async () => {
    try {
        await main();
    } catch (error) {
        core.setFailed(error.message);
    }
})();