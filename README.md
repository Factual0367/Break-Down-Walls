[![Stargazers][stars-shield]][stars-url]

<sub>
<p align='center'><img  src="https://raw.githubusercontent.com/onurhanak/Break-Down-Walls/main/graduate-hat.png" height="100" width="auto"></p>
</sub>
<h1 align="center">Break Down the Walls</h1>


<p align="center">
<a href="https://addons.mozilla.org/en-US/firefox/addon/break-down-walls/"><img src="https://user-images.githubusercontent.com/585534/107280546-7b9b2a00-6a26-11eb-8f9f-f95932f4bfec.png" style='border-radius:15px' alt="Get Break Down Walls"></a>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#credits">Credits</a></li>
  </ol>
</details>

## About The Project

This extension makes it simpler for users to access and download scientific articles and books from Amazon, Goodreads and Google Books. It adds a button to the toolbar which serves different purposes based on the page you are viewing.

This extension makes it simpler for users to access and download scientific articles and books from Amazon, Goodreads and Google Books. It adds a button to the toolbar which serves different purposes based on the page you are viewing.

- If you are viewing a scientific article and you press the toolbar button, the extension will attempt to open the article in one of the Sci-hub mirrors or on Nexus if Sci-hub does not have the article. 

- If you are viewing a book on Amazon, Google Books or Goodreads, pressing the toolbar button will automatically search for the book on Libgen or Anna's Archive and present the search results to you.

The extension includes a 'Download PDF' option in the context menu, which is accessible by right-clicking on a link. If the link is to a scientific article, the extension will download the PDF for you. If the link is to a book on a supported website, it will open Libgen search results for you. Note that the right-click 'Download PDF' option does not work with Goodreads and Google Books. If you want to find a book from Goodreads or Google Books on Libgen, please open the book page and use the toolbar button.

It is also possible to change which Sci-hub and Library Genesis mirrors are used by navigating to the extension options.

Chromium based browser support is not planned, I do not have the time to support two manifest versions. I'll accept pull requests if someone implements this for Chrome though!

## Usage

You can use the extension with scientific articles and books on Amazon, Goodreads and Google Books. You can use Scihub, Library Genesis and Anna's Archive to download.

### Amazon

![Tutorial][amazontutorial]

### Goodreads

![Demo][goodreadstutorial]

### Google Books

![Demo][gbookstutorial]

### Scihub 

![Demo][scihubtutorial]

### Using Anna's Archive

![Demo][annasarchivetutorial]

## Credits

 - The icon is made by <a href='https://www.flaticon.com/authors/umeicon'>Umeicon</a> from <a href='https://www.flaticon.com/'>www.flaticon.com</a>.

[amazontutorial]: assets/AmazonLibgen.webp
[goodreadstutorial]: assets/GoodreadsLibgen.webp
[gbookstutorial]: assets/GBooksLibgen.webp
[scihubtutorial]: assets/Scihub.webp
[annasarchivetutorial]: assets/AnnasArchive.webp
[stars-shield]: https://img.shields.io/github/stars/othneildrew/Best-README-Template.svg?style=for-the-badge
[stars-url]: https://github.com/othneildrew/Best-README-Template/stargazers
