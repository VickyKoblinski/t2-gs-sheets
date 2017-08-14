# t2-gs-sheets
A CLI Tool to make a [Google App Script](https://script.google.com/) that calls [T2 Systems](http://www.t2systems.com/) and populates a [Google Spreadsheet](https://docs.google.com/spreadsheets/) with the data.

## Installation

```
$ git clone https://github.com/VickyKoblinski/t2-gs-sheets.git
$ npm install t2-gs-sheets -g
```

## Requirements
* Node.js v0.11.0 or greater
* T2 WSDL, Username, Password
* Google Spreadsheet

## Useage

```
$ t2-gs <output-file>
```

Fill out the prompt and a script will be generated in `<output-file>`. You should be able to run the script immediately from [Google App Script](https://script.google.com/).

## License

  GPL-3.0
