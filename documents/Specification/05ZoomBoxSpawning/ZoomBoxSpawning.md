# Zoom Box Spawning
This document is part of the Dasher Version Six Specification. It describes the
addition and removal of zoom boxes.

Some terms used here are defined in earlier parts of the specification. See the
[previous section](../04ZoomingSolver/ZoomingSolver.md) of the specification,
and the [table of contents](../).

# Spawning Terms
The following terms are used with the following meanings in the specification.

-   The instantiation of new zoom box objects can be referred to as
    **Spawning**.

-   The opposite of spawning can be referred to as **Deletion**.

-   Spawning and deletion relate to zoom box formal representation. They don't
    relate to zoom box visual representation, except that visual representation
    is dependent on formal representation.

In the following definitions, zoom boxes will sometimes be described as
increasing in lateral size, or as decreasing in lateral size. These size changes
are controlled by the user and the zooming rules, but the mechanism isn't
discussed in this section.

-   When the zooming UI is reset, or opens from a cold start, the root box is
    spawned. This can be referred to as the **Root Spawn Trigger**.

-   There is only ever one root box in the zooming area. However, the current
    root box will sometimes be replaced by a different box, which then becomes
    the root box. This can be referred to as **Root Replacement**.

-   When the root box is increasing in lateral size, it could be replaced by
    one of its child boxes. This type of root replacement can be referred to as
    **Root Descent**. The replaced root box is stored outside the zoom box
    hierarchy but isn't as such deleted.

-   When the root box is decreasing in lateral size, it could be replaced by
    a zoom box that was stored during a previous root descent. This type of
    root replacement can be referred to as **Root Ascent**. The outgoing root
    box becomes a child of the replacement root box.

-   When a zoom box is increasing in lateral size, it could become a parent box,
    i.e. child boxes could be spawned under it. This can be referred to as the
    **Child Spawn Trigger**.

-   The deletion of child boxes from a parent box can be referred to as
    **Child Deletion**. It could take place in either of the following
    circumstances:

    -   When the parent box is decreasing in lateral size.

    -   When a sibling of the parent box is increasing in lateral size and the
        parent box gets pushed entirely outside the zooming area limits as a
        result.

-   The lateral size of a child box will be calculated as a proportion of the
    lateral size of its parent box. The calculation will be based on a value
    assigned to each child box when it is spawned. The factor can be referred to
    as the **Child Weight** or just as the weight if this is obvious from
    context.

    Child weight values are normalised as follows.
    
    1.  The weight values of all the child boxes of a parent box are summed in
        order to calculate a total child weight.
    2.  The lateral size of the parent box is divided by the total child weight
        to generate a unit weight.
    3.  Each child box's weight is multiplied by the unit weight to calculate
        its lateral size.
    
    Note that the root box isn't a child box and doesn't have a weight.

# Two-Stage Spawning
There are two stages to zoom box spawning.

-   **Weight Spawning** is the first spawning stage of every box.

    At this stage, the following properties of the box are required:

    -   Parent box, unless this is the root box.

    -   Box incremental text, if any.

    >   Actually, at this stage only the palette position is known, and hence
    >   the incremental text and box text.
    >
    >   Actually actually, what's required is whatever is needed to calculate
    >   the box's child weight.



The following
    parameters will be given.

    -   The lateral centre of the box.
    
    -   Either the lateral size of the box, or its front position.
        
    If the lateral size was specified, then the zooming solver will be invoked
    to generate the front position, and vice versa.
    
    The back of the box isn't specified. Boxes always extend in the forward
    direction to the zooming area limits.

    >   Where do the parameter values come from?

    After lead spawning, the box has no child boxes.

-   When the lateral size of a box passes a specified value, the
    **Child Spawn Threshold**, all of its child boxes are spawned. The first
    step for each child box will be leaf spawning, see above.


>   Near here say that it's sometimes necessary to spawn new box's child boxes
>   in order to generate its lateral weight. This is true for Group boxes, for
>   example.


It's possible that a box already passes the child spawn threshold at leaf
spawning. In that case, child spawning takes place immediately.

>   Asynchronously though, kind of.

    The origin of the parameter values depends on the trigger for spawning.

    -   The root spawn trigger specifies:
    
        -   Zero for the lateral centre, so that the root box will spawn on the
            sequential axis.
        
        -   A value for the lateral size that is fixed or calculated, for
            example as a fraction of the zooming area limits in the lateral
            dimension.
    
    -   The child spawn trigger specifies:

        The lateral size of the box, calculated from the 
        

        


The box object is instantiated at a given lateral size, referred to as its
    **Leaf Size**. The spawned size will depend on the type of spawning, as
    follows.

    -   For root spawning, the user interface will specify either the spawned



-   **Two-stage spawning**

-   **Cascade Spawning**


