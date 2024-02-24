# Zoom Box Movement
This document is part of the Dasher Version Six Specification. It describes how
zoom boxes move in response to the user.

Some terms used here are defined in earlier parts of the specification. See the
[table of contents](../).

# Zoom Box Movement Terms
The movement of zoom boxes is based on continual discrete movements, each
referred to here as a *Zooming Move* or just a move.

A zooming move can be described in the following terms.

-   Each move has a *Vector* with sequential and lateral dimensions.
-   Each move has a *Target* zoom box.

Any interfaces that generates zooming moves can be referred to as a
*Zooming Controller*. The Dasher Version Six proof-of-concept implements a
zooming controller that generates moves by tracking the position of a pointer on
the screen. The user can control the pointer by these mechanisms.

-   Using a mouse, trackball, trackpad, or other pointer device.
-   Touching the screen, on a smartphone, tablet or other device that has a
    touch screen.

Controllers are discussed in detail elsewhere in the specification TBD. That
discussion includes

-   how vector values are generated.
-   how a target zoom box is selected.

Zooming moves are processed the same regardless of the type of controller that
generated the move.

# Zoom Box Movement Processing Steps
The user interface processing for each move is described below as a sequence of
steps.

This example move vector and target are used to illustrate the processing.

Object      | Attribute            | Original Value
------------|----------------------|---------------
Target      | Front position       | 100
Target      | Lateral centre       | 200
Target      | Lateral size         | 150
Move vector | Sequential component | -30
Move vector | Lateral component    | -20

The description of each step includes a list of updated attributes. Further
objects are added to the example as required for illustration.

Processing steps are as follows.

1.  Add the vector's sequential and lateral components to the target's front
    position and lateral centre.

    Object | Attribute      |Original|Updated
    -------|----------------|--------|-------
    Target | Front position | 100    | 70
    Target | Lateral centre | 200    | 180

2.  Update the target's lateral size by invoking the solve lateral size
    function passing in its front position.

    Object | Attribute      |Original|Updated
    -------|----------------|--------|-------
    Target | Front position |        | 70
    Target | Lateral size   | 150    | 180

    For the purposes of illustration, the mapped size is assumed to be 180. The
    zooming solver isn't discussed here but moving in the reverse sequential
    direction will increase lateral size.

3.  Taking the target as a reference, cascade updates to its parents. Processing
    is described under **Zoom Box Movement Upward Cascade**, below.

    Note that there are no updates to the target during the upward cascade.

    The upward cascade finishes after the size and position of every parent up
    to the root box has been updated.

4.  Enforce the root disappearance restrictions. The restrictions prevent the
    root box from disappearing out of the zooming area user interface, in either
    dimension. Processing is described under
    **Zoom Box Movement Root Disappearance Prevention**, below.

    The outcome of this step is that the updated root box size and position
    values may have been overridden.



5.  Check for necessary adjustments to any child boxes that weren't updated in
    the upward cascade. Processing is described under
    **Zoom Box Movement Downward Cascade**, below.

    The conditions for downward cascades are as follows.

    -   Downward cascade applies to the child boxes of the target box.
    -   If a zoom box was part of the upward cascade, but its child boxes
        weren't, then downward cascade applies to the child boxes.

    The downward cascades can result in boxes being added and removed from the
    hierarchy.

    The downward cascades won't change the sizes and positions of the target nor
    any boxes that were updated during the upward cascade. However, other
    changes could be applied to those boxes, such as child deletion and root
    replacement.

That concludes move processing.

# Zoom Box Movement Cascade Diagram
This diagram illustrates which boxes in the hierarchy are updated at what stage
of Zoom Box move processing.

<picture>
    <source
        media="(prefers-color-scheme: dark)"
        srcset="MovementCascade_exported-dark.svg" >
    <img src="MovementCascade.svg">
</picture>

Key

-   T is the target of the move and is updated before the upward cascade.
-   U indicates boxes updated during the upward cascade.
-   D indicates boxes updated during the downward cascade.

# Zoom Box Movement Upward Cascade
An upward cascade is a step in zoom box movement processing, see above.
Processing here is illustrated with a continuation of the example values from
the previous description.

An upward cascade is processed in relation to a reference box, referred to in
this description as the target. The target's size and position will have been
updated prior to cascade processing.

1.  Check if the target meets the root descent conditions.

    Root descent is described elsewhere in the specification TBD but it could be
    [Zoom Box Spawning](../06ZoomBoxSpawning/ZoomBoxSpawning.md). For
    convenience, the conditions are that the zooming area limits are entirely
    within the target. These are some outcomes of root descent.
    
    -   The current root box, and any intermediate parent boxes between it and
        the target, are stored outside the hierarchy. The child boxes of any
        stored root boxes, other than the new root box, may be deleted or
        cached.
    -   The target box becomes the root of the hierarchy.

    If the root descent conditions were met then the upward cascade is finished
    and remaining steps are skipped.

2.  If the target is the root of the zoom box hierarchy then check if the root
    ascent conditions are met.

    Root ascent is described elsewhere in the specification TBD but it could be
    [Zoom Box Spawning](../06ZoomBoxSpawning/ZoomBoxSpawning.md). For
    convenience, the conditions are these.
    
    -   The zooming area limits aren't entirely within the root box.
    -   There is at least one stored box from a previous root descent.

    (There won't be a stored box if the target is the original root with empty
    box text.)

    These are some outcomes of root ascent.

    -   The previously stored parent of the target will be the root.
    -   The target box will be a child of the new root.
    -   Siblings of the target box will have been weight spawned.

    After root ascent is processed, the upward cascade continues.

3.  If the target is the root of the zoom box hierarchy, skip the remaining
    steps. The upward cascade is finished.

    Note that if the target was the root at the start of cascade processing then
    it could only be the root now if the root ascent conditions weren't met in
    the previous step.

4.  Update the target's parent's lateral size based on the target's child weight
    and updated lateral size.
    
    Object | Attribute    |Original|Updated
    -------|--------------|--------|-------
    Target | Child weight | 0.1    |
    Target | Lateral size |        | 180
    Parent | Lateral size | 1500   | 1800

    The parent lateral size is an example for the purposes of illustration. For
    ease of reading, child weight has been normalised here. In detail, the
    target child weight could be one, for example, which means the sum of all
    its siblings' child weights would be ten.

    >   Near here, enforce the minimum root size and enforce that the root box
    >   doesn't disappear from the zooming area, i.e. enforce a maximum value
    >   for the bottom of the root, and a minimum value for the top of the box.
    >
    >   If the move would violate the above then it has to be adjusted. That
    >   suggests the lateral size calculation should cascade upwards all the way
    >   to the root, even processing possible root ascent, before the rest of
    >   the cascade is processed. Otherwise some processing would have to be
    >   undone.
    >
    >   The first upward cascade could be parents only, no siblings. Their
    >   lateral sizes and positions would have to be updated. If a limit would
    >   be broken at the root then calculate an adjusted move to apply to the
    >   child that caused the break and descend to the original target yikes.
    >   That could be optimised by pre-calculating for each box not only its own
    >   weight buy also total weights of siblings before it and siblings after
    >   it. Weights don't change after spawning.


5.  Update the target's parent's lateral centre

    1.  Sum the weights of the target's siblings that are before it in the
        parent to generate a result W1. Note that W1 would be zero if the target
        is the first child.
    2.  Sum the weights of the target and all its siblings to generate a result
        W2.
    3.  Calculate an updated parent lateral offset (PLO) by multiplying the
        parent's updated lateral size (ULS) by W1, then dividing the result by
        W2.
        
        As a formula `PLO = (ULS × W1) ÷ W2`.

    4.  Calculate an updated parent lateral edge (PLE) the sum of these factors.
    
        -   The target's lateral centre (TLC).
        -   The target's lateral size (TLS) divided by two.
        -   PLO.

        As a formula `PLE = TLC + (TLS ÷ 2) + PLO`
    
    5. Deduct half the parent's updated lateral size from PLE.

    The result is the parent's updated lateral centre.
    
    Object or objects                   | Attribute            |Original|Updated
    ------------------------------------|----------------------|--------|-------
    Target                              | Lateral centre       |        | 180
    Target                              | Lateral size         |        | 180
    Parent                              | Lateral size         |        | 1800
    Siblings that are before the target | Sum of child weights |    0.2 |
    Parent                              | Lateral centre       |   -175 | -270

    The sum of child weights is an example for the purposes of illustration. For
    ease of reading, child weight has been normalised here. In the terms used in
    the calculation, above, W2 is one.

    The parent lateral centre calculation in full is as follows.  
    `180 + (180 ÷ 2) + (1800 × 0.2) - (1800 ÷ 2) = -270`

    (Note that child weights don't change after spawning. That means the sum of
    the weights of the siblings before each child need only be calculated once,
    at weight spawning time. That and use of normalised weights are possible
    optimisations for implementation.)

6.  Update the parent's front position by invoking the solve front position
    function passing in its updated lateral size.

    Note that this processing step is similar to step 2. The lateral size of a
    zoom box that has moved is updated to a value returned by a solver function.

    Object      | Attribute      |Original|Updated
    ------------|----------------|--------|-------
    Parent      | Lateral size   |        | 1800
    Parent      | Front position | -1250  | -1550

    As before, the mapped size has been assumed for the purposes of
    illustration. The value is consistent with a square solver type of
    algorithm; the change in front position is the same as the change in the
    lateral size.

7.  Taking the parent box as the reference instead of the target repeat the
    upward cascade steps above.

    In effect, upward cascade processing ascends the hierarchy until the root
    box's size and position has been updated.

That concludes processing of the upward cascade.





5.  Update the target's siblings' lateral sizes based on their child weights and
    the parent's updated lateral size.

    Object      | Attribute    |Original|Updated
    ------------|--------------|--------|-------
    Parent      | Lateral size |        | 1800
    Sibling 1   | Child weight | 0.2    |
    Sibling 1   | Lateral size | 300    | 360
    Sibling 2   | Child weight | 0.08   |
    Sibling 2   | Lateral size | 120    | 144
    Sibling ... |              |        |

    The sibling values are examples for the purposes of illustration. Only two
    siblings have been shown. In a typical zoom box there would be up to 25 in a
    hierarchical palette, or around 70 in a flat palette.




6.  Update the target's siblings' lateral centres so that they fill the parent's
    updated lateral size with no gaps and no overlapping, as they would have
    been before move processing started. The calculations can be like this.

    1.  Calculate the sum of the adjusted lateral sizes of all the target's
        siblings that are before it in the parent to generate a result R1. Note
        that R1 could be zero, if the target is the first child.
    2.  Calculate R1 plus half the updated lateral size of the target to
        generate a result R2.
    3.  Calculate R2 plus the updated lateral centre of the target to generate a
        new parent lateral edge (PLE).
    4.  Calculate PLE minus half the updated lateral size of the parent's first
        child to generate a result R3.
    5.  Update the first child's lateral centre to R3.
    6.  Decrement PLE by the updated lateral size of the first child.
    7.  Repeat the calculation from step 4 but with the second child, then the
        third child, and so on until all the target's siblings have had their
        lateral centres updated.

    Note that the target's lateral centre won't change in the above
    calculations.

    Object      | Attribute      |Original|Updated
    ------------|----------------|--------|-------
    Sibling 1   | Lateral size   |        | 360
    Sibling 1   | Lateral centre | 425    | 450
    Target      | Lateral size   |        | 180
    Target      | Lateral centre |        | 180
    Sibling 2   | Lateral size   |        | 144
    Sibling 2   | Lateral centre | 65     | 18
    Sibling ... |                |        |

    In this example, Sibling 1 is the first child of the target's parent, the
    target is the second, and Sibling 2 is the third. Further siblings aren't
    shown.

7.  Update the siblings' front positions by invoking the solve front position
    function passing in each of their updated lateral sizes.

    Object      | Attribute      |Original|Updated
    ------------|----------------|--------|-------
    Sibling 1   | Lateral size   |        | 360
    Sibling 1   | Front position | -50    | -110
    Sibling 2   | Lateral size   |        | 144
    Sibling 2   | Front position | 130    | 106
    Sibling ... |                |        |

    As before, the mapped sizes have been assumed for the purposes of
    illustration. These values are consistent with a square solver type of
    algorithm.

8.  Update the target's parent's lateral centre based on its updated lateral
    size and its first child's updated lateral centre and size. The calculations
    can be like this.

    1.  Calculate the first child's updated lateral centre plus half the first
        child's updated lateral size to generate the Parent Lateral Edge (PLE).
    2.  Calculate PLE minus half the parent's updated lateral size to generate
        the parent's updated lateral centre.

    Object      | Attribute      |Original|Updated
    ------------|----------------|--------|-------
    Sibling 1   | Lateral size   |        | 360
    Sibling 1   | Lateral centre |        | 450
    Parent      | Lateral size   |        | 1800
    Parent      | Lateral centre | -175   | -270

    The calculation is like this.

        PLE = Sibling 1 lateral centre + ( Sibling 1 lateral size / 2 )
            = 630
        Parent lateral centre = PLE - ( Parent lateral size / 2 )
                              = 630 - 900




# Zoom Box Movement Processing Diagrams
These diagrams illustrate the examples in the processing steps, above.

Zoom boxes are shown as three-sided rectangles.

Updates in each step are shown by

-   solid lines for zoom boxes as they are at the start of the step.
-   dashed lines for the end of the step.

Dotted lines

-   with arrows and numbers indicate size and position values.
-   without arrows indicate lateral centres of zoom boxes for the purposes of
    showing lateral size in two halves or for showing lateral position.

In steps where a lateral size is changed, the updated box is shown with the same
lateral centre. There will be a later step in which lateral position also
changes.

Each diagrams is drawn to a scale that best shows the update in the
corresponding processing step. This means that the diagrams are at different
scales.

The first diagram illustrates the starting positions and some sizes.

<picture>
    <source
        media="(prefers-color-scheme: dark)"
        srcset="MoveProcessing00_exported-dark.svg" >
    <img src="MoveProcessing00.svg">
</picture>

<picture>
    <source
        media="(prefers-color-scheme: dark)"
        srcset="MoveProcessing01_exported-dark.svg" >
    <img src="MoveProcessing01.svg">
</picture>

<picture>
    <source
        media="(prefers-color-scheme: dark)"
        srcset="MoveProcessing02_exported-dark.svg" >
    <img src="MoveProcessing02.svg">
</picture>

<picture>
    <source
        media="(prefers-color-scheme: dark)"
        srcset="MoveProcessing03_exported-dark.svg" >
    <img src="MoveProcessing03.svg">
</picture>

<picture>
    <source
        media="(prefers-color-scheme: dark)"
        srcset="MoveProcessing04_exported-dark.svg" >
    <img src="MoveProcessing04.svg">
</picture>

<picture>
    <source
        media="(prefers-color-scheme: dark)"
        srcset="MoveProcessing05_exported-dark.svg" >
    <img src="MoveProcessing05.svg">
</picture>

<picture>
    <source
        media="(prefers-color-scheme: dark)"
        srcset="MoveProcessing06_exported-dark.svg" >
    <img src="MoveProcessing06.svg">
</picture>

<picture>
    <source
        media="(prefers-color-scheme: dark)"
        srcset="MoveProcessing07_exported-dark.svg" >
    <img src="MoveProcessing07.svg">
</picture>

<picture>
    <source
        media="(prefers-color-scheme: dark)"
        srcset="MoveProcessing08_exported-dark.svg" >
    <img src="MoveProcessing08.svg">
</picture>



# Zoom Box Movement Root Disappearance Prevention
Prevention of disappearance of the root box is a step in zoom box movement
processing, see above.

Disappearance of the root box is prevented by restricting its size and position.
These restrictions are applied.
    
-   The root box has a minimum lateral size (MLS).
-   One or more of these conditions must be true, based on the root box's formal
    representation.
    -   The root box is entirely within the zooming area, laterally.
    -   The zooming area is entirely within the root box, laterally
    -   A minimum margin amount (MMA) of the root box is laterally within the
        zooming area.

Minimum values could be expressed as absolute values, or as formulas based on
the size of the zooming area, or both. MMA could be the same as MLS.

Root disappearance prevention takes place after the root box's size and position
have been updated.

These terms are used with these meanings here.

-   There are two zooming area limits in the lateral dimension, the 
    *positive lateral limit* and the *negative lateral limit*. The positive
    lateral limit has a higher value in the lateral dimension than the negative
    lateral limit.
    
    In the Dasher Version Six proof-of-concept, for example, the positive
    lateral limit is the top of the zooming area and the negative lateral limit
    is the bottom.

-   There are two zooming area margins in the lateral dimension. Each margin has
    a value in the lateral dimension only.

    The value of one margin, the *positive lateral margin*, is calculated by
    deducting MMA from the positive lateral limit.

    The value of the other margin, the *negative lateral margin*, is calculated
    by adding MMA to the negative lateral limit.

-   Each zoom box has two sides in the lateral dimension. Each side has a
    value in the lateral dimension only.
    
    The value of one side, the *positive lateral side*, is calculated by adding
    half the box's lateral size to its lateral centre.

    The value of the other side, the *negative lateral side*, is calculated by
    deducting the box's lateral size from the positive lateral side.

All those defined values are signed numbers.

The distances of the limits and sides from the zooming area origin isn't
relevant to the processing here.

Processing is as follows.

1.  Check if the root box's updated lateral size is below MLS. If it is then
    override the size to MLS instead.
    
2.  If the root box's lateral size was overridden in the previous step then
    override its front position too. Generate the override value by invoking the
    solve front position function passing in the new lateral size.

    The zooming solver is described elsewhere in the specification, see
    [Zooming Solver](../04ZoomingSolver/ZoomingSolver.md).

3.  If the positive lateral side has a lower value than the positive lateral
    limit, and the negative lateral side has a higher value than the negative
    lateral limit, then root disappearance prevention processing is complete and
    the remaining steps are skipped.

4.  If the positive lateral side has a higher value than the positive lateral
    limit, and the negative lateral side has a lower value than the negative
    lateral limit, then root disappearance prevention processing is complete and
    the remaining steps are skipped.

5.  Calculate the root box's positive marginal visibility (PMV) by deducting its
    positive lateral side value from the negative lateral margin value. If PMV
    is more than zero then the MMA restriction has been broken.

    Adjust the root box's position by adding PMV to its lateral centre. That
    adjustment will enforce the MMA restriction and the remaining steps are
    skipped.

    Otherwise, if PMV is less than or equal to zero, continue to the next step.

6.  Calculate the root box's negative marginal visibility (NMV) by deducting its
    negative lateral side value from the positive lateral margin value. If NMV
    is less than zero then the MMA restriction has been broken.

    Adjust the root box's position by adding NMV to its lateral centre. That
    adjustment will enforce the MMA restriction and the remaining steps are
    skipped.

    Otherwise, if NMV is greater than or equal to zero, the MMA restriction
    hasn't been broken.





# Zoom Box Movement Downward Cascade
Downward cascades are a step in zoom box movement processing, see above.

Each downward cascade starts at a particular zoom box that has just been
updated, referred to here as the *Cascade Parent*.

An initial set of cascade parents is generated as part of zoom box movement
processing, see above. For example, the target box of a zooming move will be a
cascade parent.

The processing for one downward cascade can result in further downward cascades,
to the child boxes of the cascade parent. In those cascades the child boxes will
be the cascade parents. This is described in the processing steps below.


1.  Check if the cascade parent now meets the child deletion conditions. If the
    conditions are met then process child deletion now and skip the remaining
    steps for this downward cascade.

    Child deletion is described elsewhere in the specification TBD but it could
    be [Zoom Box Spawning](../06ZoomBoxSpawning/ZoomBoxSpawning.md). For
    convenience, the conditions are that the cascade parent is entirely outside
    the zooming area limits.

2.  Check the child spawning conditions. If the conditions are met, process
    child spawning now and skip the remaining steps for this downward cascade.
    
    Child spawning is described elsewhere in the specification. For
    convenience, the conditions are that

    -   the box has no child boxes.
    -   all or part of the box is inside the zooming area limits.
    -   the box's lateral size can be calculated and is above a configured
        child spawning threshold.

3.  

3.  If the changed box already has child boxes update child box sizes and
    positions based on the updated parent size and position.

>   Root replacement goes here too.

That completes processing of a downward cascade.

# Next Section
The next section in the specification is TBD.

See also the [table of contents](../).

# Document Information
This document is part of the Dasher project and is under revision control here:  
[https://github.com/dasher-project/dasher-web](https://github.com/dasher-project/dasher-web)

(c) 2023 The ACE Centre-North, UK registered charity 1089313.  
MIT licensed, see [https://opensource.org/licenses/MIT](https://opensource.org/licenses/MIT)
