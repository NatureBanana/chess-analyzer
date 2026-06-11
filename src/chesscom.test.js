import test from "node:test";
import assert from "node:assert/strict";
import { fetchArchiveGames, loadPlayer, parsePGNGame, resultFromArchive } from "./chesscom.js";

const user = "alice";
const archiveUrl = `https://api.chess.com/pub/player/${user}/games/2024/01`;

function response(body, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    async json() { return body; },
    async text() { return String(body); },
  };
}

function pgnGame({ link, white = "Alice", black = "Bob", result = "1-0", date = "2024.01.01" }) {
  return [
    '[Event "Live Chess"]',
    '[Site "Chess.com"]',
    `[Date "${date}"]`,
    `[White "${white}"]`,
    `[Black "${black}"]`,
    `[Result "${result}"]`,
    `[UTCDate "${date}"]`,
    '[TimeControl "600"]',
    '[ECO "C20"]',
    '[ECOUrl "https://www.chess.com/openings/Kings-Pawn-Opening"]',
    `[Link "${link}"]`,
    "",
    `1. e4 e5 ${result}`,
  ].join("\n");
}

test("empty archive JSON falls back to PGN instead of accepting a zero count", async () => {
  const calls = [];
  const fetchImpl = async url => {
    calls.push(url);
    if (url === archiveUrl) return response({ games: [] });
    if (url === `${archiveUrl}/pgn`) {
      return response([
        pgnGame({ link: "https://www.chess.com/game/live/1" }),
        pgnGame({ link: "https://www.chess.com/game/live/2", black: "Carol", result: "0-1", date: "2024.01.02" }),
      ].join("\n\n"));
    }
    throw new Error(`Unexpected URL ${url}`);
  };

  const games = await fetchArchiveGames(archiveUrl, user, { fetchImpl });

  assert.equal(games.length, 2);
  assert.deepEqual(calls, [archiveUrl, `${archiveUrl}/pgn`]);
});

test("PGN fallback games keep sortable end times from PGN dates", () => {
  const game = parsePGNGame(pgnGame({ link: "https://www.chess.com/game/live/3", date: "2024.01.03" }), user);

  assert.equal(game.date, "2024.01.03");
  assert.ok(game.endTime > 0);
});

test("Chess.com draw result strings are classified as draws", () => {
  assert.equal(resultFromArchive(undefined, "draw", "white"), "draw");
  assert.equal(resultFromArchive(undefined, "stalemate", "black"), "draw");
});

test("player loads are stable and dedupe repeated game records", async () => {
  const game = {
    url: "https://www.chess.com/game/live/10",
    white: { username: "Alice", rating: 1500, result: "win" },
    black: { username: "Bob", rating: 1450, result: "resigned" },
    time_class: "rapid",
    time_control: "600",
    end_time: 1704067200,
  };
  const secondGame = {
    ...game,
    url: "https://www.chess.com/game/live/11",
    black: { username: "Carol", rating: 1520, result: "timeout" },
    end_time: 1704153600,
  };
  const fetchImpl = async url => {
    if (url === `https://api.chess.com/pub/player/${user}`) return response({ username: "Alice" });
    if (url === `https://api.chess.com/pub/player/${user}/stats`) return response({});
    if (url === `https://api.chess.com/pub/player/${user}/games/archives`) return response({ archives: [archiveUrl] });
    if (url === archiveUrl) return response({ games: [game, { ...game }, secondGame] });
    throw new Error(`Unexpected URL ${url}`);
  };

  const first = await loadPlayer(user, 3, { fetchImpl });
  const second = await loadPlayer(user, 3, { fetchImpl });

  assert.equal(first.games.length, 2);
  assert.equal(second.games.length, 2);
  assert.deepEqual(first.games.map(g => g.url), second.games.map(g => g.url));
});
