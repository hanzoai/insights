# CDP Script Function Templates

Script function templates are the main way that people will get started with the CDP V2. Templates are ephemeral configurations of InsightsFunctions. They are purposefully ephemeral for a few reasons:

1. Easier to manage as they are just code in the `insights` repo - we don't need to worry about keeping a database in sync
2. Update conflicts are left to the user to manage - changing the template doesn't change their function. It only will indicate in the UI that it is out of sync and they can choose to pull in the updated template changes, resolving any issues at that point.
3. Sharing templates becomes very simple - it can all be done via a URL

## Notes on building good templates

Templates should be as generic as possible. The underlying Script code should only do what is required for communicating with the destination or triggering the workflow.

All input data should be controlled via the `inputs_schema` wherever possible as this leaves ultimate flexibility in the hands of the user of the template as they can inject data from the source (whether it is an Event, an ActivityLog or anything else) using Script templating. If you hit the limits of the input templating, considering working with #team-cdp to extend these before writing a Script function that is too tightly coupled to

## Filtering

Filtering of the incoming source should almost always **not** be done in the Script code itself. Insights provides a filtering UI when setting up the source that is powerful and generic to the source to ensure the function is only run when it needs to.

This isn't a hard rule of course, you can also do filtering in Script just be aware that it limits the re-usability of your function.
