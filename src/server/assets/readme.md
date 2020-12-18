# Asset serving and management...

## some notes 18/12/20:

Keep a config file in user home.

That includes a string for the base directory where we expect to find assets.

For current work towards gig, this should be a shared dropbox folder (the location of which will be different on different machines... **consider issues with sync clashing if many machines are pointing to different versions of same share**).

The server should be able to serve files relative to that base such that the same configuration behaves similarly on different machines.