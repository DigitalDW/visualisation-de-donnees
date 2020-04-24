# 2015 migration data visualisation
### A simple d3 document that uses the U.N.'s 2015 migration data and displays is visually on a geoJSON world map.

![](images/main_view.png)
*Main view after clicking on a country*

## The project
This d3 document was developped in the context of Isaac Pante's and Loïc Cattani's "Visualisation de données" class at the University of Lausanne (UNIL).
The idea was to visually display the [U.N. 2015 migration data](https://www.un.org/en/development/desa/population/migration/data/estimates2/estimates15.asp) on a world map. Each country had to be clickable and, after a click, had to display a path to the countries this country's people emigrated to. Each colored circle represents an emigration from the origin country (white circle). The colored circles' sizes vary depending on how many people emigrated to that country.
