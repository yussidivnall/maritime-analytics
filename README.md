# Maritime analytics tools

A set of tools to perform analytics on marine related data.
This has been developer with the aim of improving human rights and search and rescue operation, 
as well as investigation tools for when things go wrong.

These tools rely heavily on [AISStream](https://aisstream.io/), If you find this useful, please consider contributing.

This is writen to be deployed on Google Cloud Platform (GCP), It utilises BigQuery and Cloud Run. It should be easily adaptable to other cloud providers.

## Config

### Environment
In order to run, environment variables defined in env.example needs to be set.

The JSON config file defines arean, which is a list of regions to pass to AISStream, giving lat/long pairs
```json
  "arena": [[[ TOP_LEFT_LAT_1, TOP_LEFT_LONG_1], [BOTTOM_RIGHT_LAT_1, BOTTOM_RIGHT_LONG_1]]] 
```

You can specify which boats to request, using an array of MMSI codes (as strings).

# Google Cloud Resources
You need a secret called `AISStreamAPIKey`, a big query database to store the records.
By Defaul, this will be the Dataset 'AIS' using the table 'Position Reports'.

You also need a service account with access to the bucket CONFIG_BUCKET, the AISSTREAM_APIKEY_SECRET_NAME secret and insert rights to BIGQUERY_DATASET_ID

## Run
This is largely meant to run of Google Cloud Services, however, you can run it locally using
`npm start`
provided you set up the required resources.

