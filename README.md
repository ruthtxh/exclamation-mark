# Markdown Image Alt-text Checker
This action checks markdown (.md) files for images and flags out missing inline alt-text. Optional usage with the Microsoft Azure Cognitive Services integration to get suggestions for the missing alt-text. Can be run as part of a PR pre-merge check or periodically using the `workflow_dispatch` trigger.

### Why should images have alt-text?
Alt-text increases the accessibility of your project by describing the image to visitors who do not have the ability to see them. Also, it also helps with search engine optimisation.

### What is the syntax of a markdown image?
Example of proper markdown image syntax: 
```
![alt-text](url)
```
Example of markdown image syntax with missing alt-text:
```
![](url)
```

### How will this action help?
Overall report on files that contain images with missing alt-text:
![github-action-report](https://user-images.githubusercontent.com/40910744/233547633-ad9d8c6d-6356-4098-93ee-34bd33cd35c4.png)

Detailed annotation on relevant file that flags out on line level:
![github-action-annotation](https://user-images.githubusercontent.com/40910744/233547407-d62ac482-c7d7-499d-b104-311201ef4e7a.png)

---

## Usage
### Pre-requisites
1. Create a `workflow.yml` file in your repository's .github/workflows directory. An example workflow is available below. For more information, see the [GitHub Help Documentation for Creating a workflow file](https://docs.github.com/en/actions/quickstart).

2. [Configure your workflow permission](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository#configuring-the-default-github_token-permissions) to read and write.

### Inputs
| Name     | Description                                                                                       | Required | Value                                       |
|----------|---------------------------------------------------------------------------------------------------|----------|---------------------------------------------|
| owner    | The owner of the repository                                                                        | True     | ${{ github.repository_owner }}              |
| repo     | The name of the repository                                                                         | True     | ${{ github.event.repository.name }}         |
| token    | The token to access the GitHub API                                                                 | True     | ${{ secrets.GITHUB_TOKEN }}                 |
| ref      | The branch name                                                                                    | True     | ${{ github.head_ref \|\| github.ref_name }} |
| sha      | The SHA of the commit                                                                              | True       | ${{ github.sha }}                           |
| key      | The API key for Azure Computer Vision resource (stored as a GitHub Actions secret)                | False    | ${{ secrets.YOUR_API_KEY_NAME }}                |
| endpoint | The endpoint for Azure Computer Vision resource                                                   | False    | https://YOUR_CV_RESOURCE_NAME.cognitiveservices.azure.com                               |


#### Azure Computer Vision integration (Optional)
1. [Create a computer vision resource](https://portal.azure.com/#create/Microsoft.CognitiveServicesComputerVision) in the Azure portal and get your API key and endpoint.

2. [Create a GitHub Actions secret](https://docs.github.com/en/actions/security-guides/encrypted-secrets) to store your API key.


### Example workflow

#### Basic checker for flagging out missing alt-text
```
name: 1. Basic checker
on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]
  workflow_dispatch:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Basic checker
        uses: ruthtxh/markdown-image-alt-text-checker@main
        with:
          owner: ${{ github.repository_owner }}
          repo: ${{ github.event.repository.name }}
          token: ${{ secrets.GITHUB_TOKEN }}
          ref: ${{ github.head_ref || github.ref_name }}
          sha: ${{ github.sha }}
```

#### Advance checker with Azure Computer Vision integration for alt-text suggestion
```
name: 2. Advance checker
on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]
  workflow_dispatch:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Advance checker
        uses: ruthtxh/markdown-image-alt-text-checker@main
        with:
          owner: ${{ github.repository_owner }}
          repo: ${{ github.event.repository.name }}
          token: ${{ secrets.GITHUB_TOKEN }}
          ref: ${{ github.head_ref || github.ref_name }}
          sha: ${{ github.sha }}
          key: ${{ secrets.api_key }}
          endpoint: 'https://YOUR_CV_RESOURCE_NAME.cognitiveservices.azure.com'
```
For actual usage, refer to the [markdown-image-alt-text-checker-test repository](https://github.com/ruthtxh/markdown-image-alt-text-checker-test/).

