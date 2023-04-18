# ❗[Exclamation Mark] Markdown Image Alt-text Checker
This action checks markdown (.md) files for images and flags out missing alt-text. Optional usage with the Microsoft Azure Cognitive Services integration to get suggestions for the missing alt-text. Can be run as part of a PR pre-merge check or periodically using the `workflow_dispatch` trigger.

### Why should images have alt-text?
Alt-text increases the accessibility of your project by describing the image to visitors who do not have the ability to see them. Also, it also helps with search engine optimisation.

### What is the proper syntax of a markdown image?
Example of proper markdown image syntax: 
```
![alt-text](url)
```
Example of markdown image syntax with missing alt-text:
```
![](url)
```

---

## Usage
### Pre-requisites
Create a workflow .yml file in your repository's .github/workflows directory. An example workflow is available below. For more information, see the GitHub Help Documentation for Creating a workflow file.

### Inputs
| Name     | Description                                                                                       | Required | Value                                       |
|----------|---------------------------------------------------------------------------------------------------|----------|---------------------------------------------|
| owner    | The owner of the repository                                                                        | True     | ${{ github.repository_owner }}              |
| repo     | The name of the repository                                                                         | True     | ${{ github.event.repository.name }}         |
| token    | The token to access the GitHub API                                                                 | True     | ${{ secrets.GITHUB_TOKEN }}                 |
| ref      | The branch name                                                                                    | True     | ${{ github.head_ref \|\| github.ref_name }} |
| sha      | The SHA of the commit                                                                              | False    | ${{ github.sha }}                           |
| key      | The API key for Azure Computer Vision resource (stored as a GitHub Actions secret¹)                | False    | ${{ secrets.YOUR_KEY_NAME }}                |
| endpoint | The endpoint for Azure Computer Vision resource (stored as a GitHub Actions environment variable²) | False    | ${{ env.endpoint }}                         |


#### Azure Computer Vision integrations
¹ Creating a GitHub Actions  secret

² Creating a GitHub Actions environment variable

[Create a computer vision resource](https://portal.azure.com/#create/Microsoft.CognitiveServicesComputerVision) in the Azure portal to get your key and endpoint. 
Note: the Azure Computer Vision endpoint has the form `https://YOUR_COMPUTER_VISION_RESOURCE_NAME.cognitiveservices.azure.com`



### Example workflow

#### Basic checker for flagging out missing alt-text

#### Advance checker with Azure Computer Vision suggestion for alt-text



## License