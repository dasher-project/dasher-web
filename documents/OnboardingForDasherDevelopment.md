# Welcome!

So you are interested in joining the dasher v6 group. What's it all about and how to engage with the group are all below!

## The 30 second video

[![Dasher: 30s intro](https://yt-embed.herokuapp.com/embed?v=QOzmX2WpPZY)](https://www.youtube.com/watch?v=QOzmX2WpPZY "Dasher:30s intro")

## In detail

Dasher is a zooming interface. Point where you want to go, and the display zooms in wherever you point. The world into which you are zooming is painted with letters, so that any point you zoom in on corresponds to a piece of text. The more you zoom in, the longer the piece of text you have written. You choose what you write by choosing where to zoom.

In the example to the right, the user is writing "Hello,\_how_are_you?". ![Dasher gif](http://www.inference.org.uk/dasher/images/newdasher.gif)

To make the interface efficient, we use the predictions of a language model to determine how much of the world is devoted to each piece of text. Probable pieces of text are given more space, so they are quick and easy to select. Improbable pieces of text (for example, text with spelling mistakes) are given less space, so they are harder to write. The language model learns all the time: if you use a novel word once, it is easier to write next time.

A big advantage of Dasher over other predictive text-entry interfaces that offer word-completions to the user is that it is mode-free: the user does not need to switch from a writing mode to an "accept-model-predictions" mode.

Another advantage is that it is easy to train the model on any writing style: simply load up an example file, then write away!

For a longer (3 page) version of this see [here](http://www.inference.org.uk/dasher/Novice.html)

## A bit of brief history

Dasher was originally developed at Cambridge University by [David Mackay](http://www.inference.org.uk/mackay/). David led the inference group at Cambridge which was involved with machine learning and information theory research projects. Outputs included dasher and other text entry systems. These were found to be useful by a broad range of people - but most usefully disabled computer users.

David wanted to help making text entry faster and dasher is what came out of that. For a far more interesting and detailed look as to how it works have a watch of his talk for Google

[![Dasher: information-efficient text entry](https://yt-embed.herokuapp.com/embed?v=ie9Se7FneXE)](https://www.youtube.com/watch?v=ie9Se7FneXE "Dasher: information-efficient text entry")

In 2016 David sadly passed away. The team from the original inference group have moved onto new ventures - but many of the original team are still involved in some way or another with the original code base or new codebase being developed.

## Who uses it?

## How do you learn to use it?

Have a read of the original manual [here](https://www.inference.org.uk/dasher/download/papers/Manual.pdf).

There was also a game mode - that is available on the Linux version. See a video of this in action [here](https://www.youtube.com/watch?v=54AdL9KTjBs&feature=youtu.be).

## Was it ever researched? Evidence of how efficient it was?

Yes. Take a look at the publications [here](http://www.inference.org.uk/dasher/Publications.html). A lot of commercial entities have looked at fast text entry for alternative mouse systems such as eyegaze and headmice. Dasher typically is seen as one of the fastest modes of writing.

## Why are you trying to re-develop it?

A few reasons:

1. The codebase is not easy to work with - the different versions are not on parity of features. So it's hard to keep them up-to-date. As well as add features or fix bugs
2. The language model is thought to be improved.
3. The original code was under GPL v3. A number of commercial AT companies always wanted to make use of dasher but found no way around integrating GPL code into their commercial software. New code is under MIT and we welcome commercial entities to get involved in the project. But _please_ - if you are a commercial organisation please please please get involved in the direction and codebase of this project. Yes - you don't have to. But we would very much like you would. If you don't be too surprised if the code one day changes and your commercial version is left behind. Be part of the group. Don't just borrow.
4. Although dasher is amazing - few people take it up. We feel this is because the documentation and guides on usage could be better. We hope to improve on that with a fresh new UI.

## So wheres the code?

Code is currently being worked on in the dasher-web repo. https://github.com/dasher-project/dasher-web
The language model can be found at https://github.com/google-research/mozolm

## Who's working on this?

**Note: The vast majority of the team are donating time to this project. Although people work for organisations such as Google it does not mean these organisations are officially working on the project. **

We have a number of sub-teams working on particular areas

- Engineering

Jim Hawkins
Adam Spickard
Jay Beavers
Jeremy Cope

- Language modelling

Brian Roark
Alexander (Sasha)

- UX

Jen Spatz
Claire Hansford

- Input Methods

Will Wade
Jim Hawkins
Jay Beavers

- Output Methods

Jeremy Cope

- User evaluation

Will Wade

## How do I chat with everyone?

If you are a user you are welcome to join the google group: https://groups.google.com/g/dasher-users
For anyone involved in coding work see https://groups.google.com/g/dasher-redesign

We also have some slack channels on OpenAAC (watch this space..)

Each month we do a google meet call. You can subscribe to a group calendar of all meetings [here](https://calendar.google.com/calendar/ical/s484vvp1tt5s5uaskpb8qg14bs%40group.calendar.google.com/public/basic.ics) (NB: If you use a Mac and use Outlook for your day to day diary - see [here](https://support.microsoft.com/en-us/office/sync-your-icloud-calendar-with-outlook-for-mac-c9c67e41-274f-4527-ae5e-ea1003d89fc5) for how to display it in Outlook).

## Any docs I should be are of?

Yes. All are [here](https://drive.google.com/drive/folders/1TxyeedQI6d37qSRt0Kj_tADgzWn8mWit?usp=sharing). The main ones being:

- [The ongoing notes](https://docs.google.com/document/d/1bOu_fkynNfd95v69jQCudXs_A5iRyzDEEjCuvF1r9cY/edit?usp=sharing)
- [The roadmap](https://docs.google.com/document/d/17EPhMZTcMpDF3uzNU28FpQzsqSS_RgbK8tgxK2Vh_c8/edit?usp=sharing)

## What do all the terms mean in dasher? How _should_ it work?!

Have a read of the [specification guide](https://github.com/dasher-project/dasher-web/blob/master/documents/Specification/readme.md)

## How do I get going with the code?

Read the [contributing guide](https://github.com/dasher-project/dasher-web/blob/master/documents/Development.md).

## How does the current code all work?

Read [This](https://github.com/dasher-project/dasher-web/blob/master/documents/Loading.md).
