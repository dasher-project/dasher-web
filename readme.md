Proofs of Concept
=================
To run the proof of concept, go here:
[https://sjjhsjjh.github.io/dasher-poc/](https://sjjhsjjh.github.io/dasher-poc/)

Backlog
=======
-   Show message in the UI somewhere copy-pastable.
-   Maybe optimise origin_holder to have callbacks before and after descent.
-   Change terminology of "origin holder" to maybe "delta target".
-   Capital letters, numbers, punctuation, spaces, paragraph markers.
-   Group boxes.
-   Change box colours to be set by the CSS maybe.
-   Tidy up the drawing of the text for boxes at the top and bottom edges of the
    window. A box whose middle is out of the window should float to its top,
    maybe.
-   More use of built-in .append and .remove in piece.js module. See:

    -   https://developer.mozilla.org/en-US/docs/Web/API/ChildNode/remove
    
-   More use of Piece.toggle in zoombox.js module.
-   Review "element" vs "node" in variable and function names.
-   Change "render" to "draw" maybe.
-   Replace the ad hoc limits object with a class. Move methods like solve_left
    and solve_height into the new class.
-   Refactor out some of the the index.js module into classes, like Pointer and
    cross-hairs.
-   Move the ZoomBox base class xChange and yChange properties out to a
    dedicated custom object, or into a subclass.
-   Refactor again to have separate draw_under_control and then render maybe.

License
=======
Copyright (c) 2019 Jim Hawkins. MIT licensed, see
[https://opensource.org/licenses/MIT](https://opensource.org/licenses/MIT).
