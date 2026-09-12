import styles from "./favorite-heart-icon.module.css";

export type FavoriteHeartState = "filled" | "outline";

export function FavoriteHeartIcon({
  favorited,
  small = false,
  pending = false,
}: {
  favorited: boolean;
  small?: boolean;
  pending?: boolean;
}) {
  const state: FavoriteHeartState = favorited ? "filled" : "outline";

  return (
    <span
      className={[
        styles.heart,
        styles[state],
        small ? styles.small : styles.regular,
        pending ? styles.pending : "",
      ].filter(Boolean).join(" ")}
      data-favorite-heart={state}
      aria-hidden="true"
    />
  );
}
