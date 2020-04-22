import json
import csv

migration = None
with open('../../data/CSV/migration_2015.csv') as csv_file:
  migration = csv.reader(csv_file, delimiter=",")

  data_names = list()
  for row in migration:
    data_names.append(" ".join(row[0].split("_")))
  
  countries = None
  with open('../../data/map/world_map.json') as f:
    countries = json.load(f)

  names = list()
  for i in countries['features']:
    names.append(i['properties']['name'])
  names.sort()
  names = list(dict.fromkeys(names))
  for name in data_names:
    if name not in names:
      print(name)
    else:
      names.remove(name)
  print(names)
  