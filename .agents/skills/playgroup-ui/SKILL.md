# Booking UI Review Skill

Use this skill when reviewing or redesigning a mobile booking flow that feels crowded, over-carded, or visually noisy. The goal is to think like an expert product designer: reduce clutter, strengthen hierarchy, and improve the user's path to completion.

## Core mindset

Start from the user task, not from the existing components. In this kind of screen, the real task is usually simple: understand availability, choose a slot, and confirm.

Before suggesting UI changes, identify:
- What is the primary action on this screen?
- What information is required to complete that action?
- What content is only supporting context?
- What is visually loud but not decision-critical?

Design for one clear decision at a time. If many elements compete for attention, the screen will feel heavy even if each component is individually styled well.

## What expert designers look for

When reviewing the UI, check these issues first:
- Too many containers nested inside containers.
- Too many elements using high emphasis at the same time.
- Repeated rounded cards, shadows, pills, and badges creating visual bulk.
- Status information styled as strongly as interactive controls.
- Repeated text patterns that force users to read line by line instead of scan.
- Warning styling used for informational content.

A common smell is: everything looks important. When everything is emphasized, nothing leads.

## Priority ladder

Force the interface into a clear hierarchy. For a booking flow, the visual ladder should usually be:
1. Page purpose.
2. Selected date or date group.
3. Available time slots.
4. Primary confirm action.
5. Supporting metadata, such as class name, student name, seat count, or explanatory notes.

Anything below level 4 should not visually overpower time selection or the confirm button.

## Principles to apply

### 1. One screen, one primary action

Each viewport should point clearly toward one next step. On a booking screen, that usually means selecting a slot and confirming it. Secondary information should support that flow, not compete with it.

### 2. Reduce container depth

Do not wrap every piece of content in its own card. If items belong to the same task, keep them in one parent section and use spacing, alignment, and typography to separate them.

Use whitespace before using more borders, shadows, or background fills.

### 3. Emphasis is a limited resource

Use strong color, filled backgrounds, and high contrast only for:
- The selected state.
- The primary CTA.
- Truly important alerts.

Availability counts, class labels, and student names are usually secondary. They should read quickly without pulling focus away from slot selection.

### 4. Structure before decoration

If the layout stops making sense when border, shadow, or fill is removed, the structure is weak. Build hierarchy with order, spacing, grouping, and type scale first. Decorative treatment should only reinforce the structure.

### 5. Group by user mental model

Users think in dates first, then in time slots, then in reasons or constraints. Organize information in that order. Do not make users parse repeated full sentences if a grouped structure would say the same thing more clearly.

## Applying this to time slot selection

If the booking area feels too blocky, use patterns like these:
- Keep one main section container instead of multiple nested cards.
- Present time slots as a simple vertical list.
- Use selected, available, and unavailable states with clear but restrained differences.
- Make availability counts small and secondary.
- Consolidate metadata like class and student into a single supporting row.
- Ensure only one element is the strongest CTA in the viewport.

### Good state pattern

A good slot list usually has:
- Selected slot: filled with the brand color or strongest emphasis.
- Available slot: light surface, normal contrast.
- Unavailable slot: muted text, low-contrast surface, clearly disabled.

The status chip should never visually outweigh the time label.

## Applying this to holiday or closure notices

If a holiday notice is currently shown as a long repeated list of sentences, redesign it as structured notice content rather than raw text output.

### Common problems

- The date is repeated on every line.
- Each row has equal visual weight.
- Users must read every line instead of scanning.
- Warning colors are used even when the content is just informative.
- The notice block steals attention from the booking task.

### Better patterns

Use one of these patterns depending on priority:

#### Compact pattern
- One summary line, for example: some dates in July are unavailable.
- A link or expand action to reveal details.

#### Balanced pattern
- A short summary at the top.
- Grouped list by day.
- Small reason badges such as closed, holiday, teacher day, school break.

#### Detailed pattern
- Group by date.
- Under each date, list affected time slots as secondary text.
- Use accordion sections if the list is long.

### Grouping rule

Group by date first, then show impacted slots underneath. For example:
- 4 Jul — school break; affected slots: 9.00-10.30, 11.00-12.30, 13.15-14.45
- 6 Jul — teacher day
- 11 Jul — school break; affected slots: 9.00-10.30, 11.00-12.30, 13.15-14.45

This dramatically reduces repetition and makes the notice easier to scan.

## Conversion mindset for this flow

In this context, conversion means the target user action on the screen, such as:
- Selecting a valid time slot.
- Pressing the confirm booking button.
- Completing the booking flow successfully.

A conversion-focused redesign does not mean making everything louder. It means making the next action clearer, faster, and safer to understand.

To improve conversion:
- Remove distractions around the primary CTA.
- Make the selected state obvious.
- Reduce informational noise.
- Clarify what happens next.
- Keep notices informative but visually subordinate unless they block progress.

## Quick review checklist

Use this checklist when critiquing the screen:
- Is there only one clear primary action in the viewport?
- Are there too many visual blocks or nested cards?
- Are multiple elements using the same strong emphasis?
- Can the user scan instead of read every line?
- Is supporting metadata quieter than interactive controls?
- Are notices grouped by date and reason instead of repeated sentences?
- Is warning styling reserved for truly critical states?
- If borders and shadows are removed, does the layout still make sense?

## Default recommendations

When no special brand direction is given, recommend:
- Fewer card layers.
- Smaller and quieter badges.
- Simpler slot rows.
- Strong selected state.
- One dominant confirm button.
- Neutral notice styling for informational holiday alerts.
- Grouped notice lists by date.

## Response style

When applying this skill in conversation:
- Speak like an experienced product designer reviewing a real interface.
- Be direct about what feels heavy, noisy, or over-designed.
- Explain why the current design feels crowded.
- Suggest structural fixes before visual polish.
- Tie recommendations back to hierarchy, scanability, and completion flow.
- Use plain Thai or Thai mixed with common product terms when that matches the user's style.
