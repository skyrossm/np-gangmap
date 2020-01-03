NoPixel Territory map
====
[Live page](https://skyrossm.github.io/np-gangmap/)
This interactive (Google) map shows you the location of current NoPixel territory/gang zones.

## Screenshots

![screenshot-1](https://i.imgur.com/VavAdiG.jpg)

![screenshot-2](https://i.imgur.com/978UDPW.jpg)

![screenshot-3](https://i.imgur.com/ijtZIHO.jpg)

![screenshot-4](https://i.imgur.com/VMuDSrK.png)

## How to submit new locations
1. Go to locations.json and copy the HIGHEST id element, then increase the ID number by one.
2. Set colors, notes, video/image, etc.
3. Right click to place markers around the outline of the territory (Place in order around, or else it will be a weird shape)
4. Press the Print location array button and copy the output from the console, paste that for the latlngarray in locations.json
5. Submit an Issue or Pull Request with the new location, and I'll add it to the main page :)
![screenshot-5](https://i.imgur.com/40cSiK4.png)

## How to host yourself

1. Clone this repository
2. [Download the missing map tiles](https://mega.co.nz/#!HR1xgIQQ!I2cq1hDeWfm6A3BleDfOlTz747EpCUlX15tCt1h2IN8) and extract them into an folder called "tiles/"
3. Run `python -m SimpleHTTPServer` in the source folder if you don't have an Nginx/Apache
3.b Python 3 run `python -m http.server`

## License

[WTFPL](LICENSE)

## Version

1.0

## Credits

To [danharper](https://github.com/danharper/) for [his work](https://github.com/danharper/GTAV) on the GTA V map.
To [gta5-map](https://github.com/gta5-map) for [their work](https://github.com/gta5-map/gta5-map.github.io) on the GTA V map.
