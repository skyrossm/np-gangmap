NoPixel Territory map
====
[Live page](https://skyrossm.github.io/np-gangmap/)
This interactive (Google) map shows you the location of current NoPixel territory/gang zones.

## How to submit new locations
1. Right click on the map to add points.
2. Click "Add New Region" to print out the region data.
3. Replace "\<edit this\>" with correct information.
4. Replace the id with an unused id while trying to maintain the pattern in `locations.json`
5. Change the type, add a video or images, and change the color of the region.
6. Add new region to `locations.json` and create a pull request.

Alternatively a new issue can be created the region data and it will be added.

## How to host yourself

1. Clone this repository
2. Host the repository using Nginx, Apache, or another webserver.

To host the repository using Python 3 use in the root of the repository:
```
python -m http.server
```

## License

[WTFPL](LICENSE)

## Version

1.1.0

## Credits

To [danharper](https://github.com/danharper/) for [his work](https://github.com/danharper/GTAV) on the GTA V map.
To [gta5-map](https://github.com/gta5-map) for [their work](https://github.com/gta5-map/gta5-map.github.io) on the GTA V map.
