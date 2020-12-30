# Zoom Box Spawning
This document is part of the Dasher Version Six Specification. It describes the
addition and removal of zoom boxes at run time.

Some terms used here are defined in earlier parts of the specification. See the
[previous section](../04ZoomingSolver/ZoomingSolver.md) of the specification,
and the [table of contents](../).

# Spawning Terms
The following terms are used with the following meanings in the specification.

## Basic Terms
-   The creation of new zoom box objects is referred to here as **Spawning**.

-   The removal of existing zoom box objects is referred to here as
    **Deletion**.

-   Spawning and deletion apply to the formal representations of zoom boxes,
    not directly to the visual representations. However, indirectly:

    -   A zoom box can have a formal representation without having a visual
        representation.

    -   A zoom box cannot have a visual representation without having a formal
        representation.
    
    In other words, visual representations depend on formal representations but
    not vice versa.

    Visual representation of zoom boxes will be described later in the
    specification.

## Triggers
There are two triggers for zoom box spawning.

One trigger is **Root Spawning** which happens only when the zooming user
interface is reset or opens from a cold start. Only one box is created by root
spawning. The parameters and process of root spawning are described later in
this section. The root box is never as such deleted, but see Root Replacement,
below.

The other trigger is based on a set of conditions. After root spawning, the user
interface will become live. Zoom boxes will be moving and changing size in two
dimensions. The conditions are defined in terms of zoom box sizes and positions,
and will be being met continuously when the user interface is live. The trigger
based on these conditions is referred to as **Child Spawning**, because zoom
boxes spawned by this trigger will always be child boxes. The child spawning conditions are described later in this section.

There is one trigger for zoom box deletion, referred to as **Child Deletion**.
Child deletion is also based on a set of conditions, and will take place
continuously when the user interface is live. The child deletion conditions are
described later in this section.

## Properties and Two-Stage Spawning
There are two stages to zoom box spawning. Different properties of the spawned
box are set in each stage.

Every child zoom box has a **Child Weight** property that is specific to
spawning. The child weight expresses the relative lateral size of a zoom box
compared to its siblings. The role of child weight in the spawning processing is
described later in this section. Note that the root zoom box doesn't have a
child weight property.

Other zoom box properties that are mentioned in this section are defined earlier
in the specification. Look for Box Text, Incremental Text, Front Position,
Lateral Centre, and Lateral Size, for example, in the
[Basic Definitions](../02BasicDefinitions/BasicDefinitions.md) section. That
section also defines the terms used to describe the zoom box hierarchy, such as
root, parent, child, and sibling.

The stages of zoom box spawning are as follows.

-   **Weight** spawning stage, during which the following are set for the box.
    -   Palette correspondence.
    -   Text properties.
    -   Colour specifier.
    -   Child weight, unless it is the root box.

-   **Dimension** spawning stage, during which the initial values for the box's
    front position, lateral size, and lateral position are set.

The stages are described in detail in this section.

# Root Spawning and Initialisation
Spawning and deletion are dependent on some parts of user interface
initialisation, including the zooming area limits having been set for example.
The user interface will trigger root spawning, for example as part of its
initialisation process, but mustn't trigger it before the dependencies are in
place.

(In the Dasher Version Six proof-of-concept, root spawning is triggered
automatically towards the end of user interface initialisation. It can also be
triggered by the user, from the control panel developer options, by selecting
the reset option.)

The processing is as follows.

1.  The user interface triggers root spawning.

    The following parameters are given by the user interface.

    -   The lateral centre of the box, typically zero to position the root box
        in the centre of the zooming area.

    -   Either the front position of the box, or its lateral size.

2.  A new zoom box is instantiated and assigned as the root zoom box.

    The new box will have zero child boxes, and no parent box.

3.  The root box is assigned a correspondence to the palette root.

    This gives the root box the following properties.

    -   Box text, which will be "" the empty text.
    -   Incremental text, which will be null.
    -   Colour specifier, which will be the sequence colour with ordinal zero
        and index zero.
    
    For descriptions of correspondence, the palette root, colour specifiers and
    sequence colours, see the
    [Zoom Box Palette](../05ZoomBoxPalette/ZoomBoxPalette.md) section.

    This completes the weight spawning stage of the root box.
    
4.  The dimensions of the root box are finalised.

    The detail of finalisation depends on which optional parameter was given in
    step 1.

    -   If the front position was given, then the solve lateral size function is
        invoked.
    -   If the lateral size was given, then the solve front position function is
        invoked.

    For details of the solve functions, see the
    [Zooming Solver](../04ZoomingSolver/ZoomingSolver.md) section.

    This completes the dimension spawning stage of the root box.

The root box is then checked for child spawning, see below. If the root box
doesn't meet the child spawning conditions, then it will be the only box. The
user interface will be live though, and the root box might meet the child
spawning conditions later, depending on the actions of the user.

# Child Spawning Conditions
Child spawning will take place in a zoom box when it meets all the following
conditions.

-   The box has zero child boxes, which will be the case after:
    -   Instantiation.
    -   Child deletion, see below.
-   All or part of the box is inside the zooming area limits.
-   The box's lateral size is above a limit, referred to as the
    **Child Spawning Threshold**.

>   Second bullet could be replaced by the condition that the child deletion
>   conditions aren't met, or vice versa.

The child spawning threshold value will come from the user interface.

>   Hmm. In practice, the child spawning threshold will determine the distance
>   of prediction look ahead. Maybe a different rule could be used, like a
>   threshold on prediction strength. For example, the threshold could be
>   expressed as the child weight of the box being normalised to 20% or more.

The child spawning conditions are checked:

-   When a zoom box completes dimension spawning, see below, it is checked.

-   Every zoom box that changes position due to user interaction must be checked
    at the time of change. This is discussed later in the specification.

    >   TBD but in the section on end user controls.

    Note that a box cannot change size without changing position. See the
    [Zooming Rules](../03ZoomingRules/ZoomingRules.md) section.

>   Near here, say that a box that corresponds to a palette group node never
>   meets the condition that it has zero child boxes.

# Child Spawning
When a zoom box meets the child spawning conditions, see above, the following
processing takes place.

Note that spawning processing is based on the zoom box palette. For a full
description, see the [Zoom Box Palette](../05ZoomBoxPalette/ZoomBoxPalette.md)
section. The following points are most relevant here.

-   The palette has a hierarchical tree structure that starts from a single
    *palette root* node.
-   Each child of the palette root is either a *principal* node or a *group*
    node.
-   Each principal node has a template text, in general a single character.
-   Principal nodes don't have child nodes.
-   Group nodes have child nodes but don't have template texts.

## Hierarchy Instantiation
First, a hierarchy based on the zoom box palette is instantiated under the box
that has met the child spawning conditions, the *new parent box*, as follows.

1.  For each child node in the palette root, a new zoom box is instantiated and
    added as a child box of the new parent box. Each new box is assigned a
    correspondence to the palette node for which it was instantiated.

2.  Under each new child box that corresponds to a palette group node, hierarchy
    instantiation is repeated recursively. Recursion starts at the group node,
    not the palette root, and corresponding new zoom boxes are added as
    "grandchild" boxes, under the new child box.

3.  Each instantiated box that corresponds to a principal node is assigned an
    initial child weight of one. This applies to new child boxes that were
    instantiated directly or recursively. Child weights can change later in the
    spawning process.

>   Text assignment is next.

## Predictor Invocation


## Weight Normalisation


## Finalisation

>   Colours go here.


# Root Replacement


-   There is only ever one root box in the zooming area. However, the current
    root box will sometimes be replaced by a different box, which then becomes
    the root box. This is referred to as **Root Replacement**.

-   When the root box is increasing in lateral size, it could be replaced by one
    of its child boxes. This type of root replacement is referred to as
    **Root Descent**. The replaced root box is stored outside the zoom box
    hierarchy but isn't as such deleted.

-   When the root box is decreasing in lateral size, it could be replaced by a
    zoom box that was stored during a previous root descent. This type of root
    replacement is referred to as **Root Ascent**. The outgoing root box becomes
    a child of the replacement root box.



-   The deletion of child boxes from a parent box is referred to as
    **Child Deletion**. It could take place in either of the following
    circumstances:

    -   When the parent box is decreasing in lateral size.

    -   When a sibling of the parent box is increasing in lateral size and the
        parent box gets pushed entirely outside the zooming area limits as a
        result.

    >   But a box could get pushed outside by lateral motion as well as pushing.
    >   Also, what happens when the box re-enters the zooming area limits?

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

Child spawning and root spawning are the only triggers for zoom boxes to spawn.

# Two-Stage Spawning


-   A box that is created by child spawning goes through weight spawning when
    child spawning is triggered. The box might then go through dimension
    spawning straight away, or dimension spawning might take place later, or
    never.

Dimension spawning of a zoom box triggers child spawning. After a box goes
through dimension spawning, all its child boxes get instantiated, and each child
box then goes through, at least, its weight spawning stage.


    
    The back of the box isn't specified. Boxes always extend in the forward
    direction to the zooming area limits.

    >   Where do the parameter values come from?

    After lead spawning, the box has no child boxes.

-   When the lateral size of a box passes a specified value, the
    **Child Spawn Threshold**, all of its child boxes are spawned. The first
    step for each child box will be leaf spawning, see above.


Is dimension spawning of a box B triggered by the parent of B? Yes.





    At this stage, the following properties of the box are required:

    -   Parent box, unless this is the root box.

    -   Box incremental text, if any.

    >   Actually, at this stage only the palette position is known, and hence
    >   the incremental text and box text.
    >
    >   Actually actually, what's required is whatever is needed to calculate
    >   the box's child weight.



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



-   **Cascade Spawning**


The sequential and lateral dimensions are explained earlier in the
specification.

In the following definitions, zoom boxes will sometimes be described as
increasing in lateral size, or as decreasing in lateral size. These size changes
are controlled by the user and the zooming rules, but the mechanism isn't
discussed in this section.

