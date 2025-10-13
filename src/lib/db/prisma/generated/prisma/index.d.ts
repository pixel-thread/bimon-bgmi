
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model Player
 * 
 */
export type Player = $Result.DefaultSelection<Prisma.$PlayerPayload>
/**
 * Model GameScore
 * 
 */
export type GameScore = $Result.DefaultSelection<Prisma.$GameScorePayload>
/**
 * Model Gallery
 * 
 */
export type Gallery = $Result.DefaultSelection<Prisma.$GalleryPayload>
/**
 * Model Season
 * 
 */
export type Season = $Result.DefaultSelection<Prisma.$SeasonPayload>
/**
 * Model Tournament
 * 
 */
export type Tournament = $Result.DefaultSelection<Prisma.$TournamentPayload>
/**
 * Model PollVote
 * 
 */
export type PollVote = $Result.DefaultSelection<Prisma.$PollVotePayload>
/**
 * Model TournamentWinner
 * 
 */
export type TournamentWinner = $Result.DefaultSelection<Prisma.$TournamentWinnerPayload>
/**
 * Model Match
 * 
 */
export type Match = $Result.DefaultSelection<Prisma.$MatchPayload>
/**
 * Model Wallet
 * 
 */
export type Wallet = $Result.DefaultSelection<Prisma.$WalletPayload>
/**
 * Model PlayerStats
 * 
 */
export type PlayerStats = $Result.DefaultSelection<Prisma.$PlayerStatsPayload>
/**
 * Model Team
 * 
 */
export type Team = $Result.DefaultSelection<Prisma.$TeamPayload>
/**
 * Model KDStats
 * 
 */
export type KDStats = $Result.DefaultSelection<Prisma.$KDStatsPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const Role: {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  PLAYER: 'PLAYER'
};

export type Role = (typeof Role)[keyof typeof Role]


export const PlayerCategory: {
  ULTRA_NOOB: 'ULTRA_NOOB',
  NOOB: 'NOOB',
  PRO: 'PRO',
  ULTRA_PRO: 'ULTRA_PRO'
};

export type PlayerCategory = (typeof PlayerCategory)[keyof typeof PlayerCategory]


export const Status: {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  DELETED: 'DELETED'
};

export type Status = (typeof Status)[keyof typeof Status]


export const SeasonStatus: {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE'
};

export type SeasonStatus = (typeof SeasonStatus)[keyof typeof SeasonStatus]


export const Vote: {
  IN: 'IN',
  OUT: 'OUT',
  SOLO: 'SOLO'
};

export type Vote = (typeof Vote)[keyof typeof Vote]


export const Category: {
  NOOB: 'NOOB',
  PRO: 'PRO',
  ULTRA_NOOB: 'ULTRA_NOOB',
  ULTRA_PRO: 'ULTRA_PRO'
};

export type Category = (typeof Category)[keyof typeof Category]

}

export type Role = $Enums.Role

export const Role: typeof $Enums.Role

export type PlayerCategory = $Enums.PlayerCategory

export const PlayerCategory: typeof $Enums.PlayerCategory

export type Status = $Enums.Status

export const Status: typeof $Enums.Status

export type SeasonStatus = $Enums.SeasonStatus

export const SeasonStatus: typeof $Enums.SeasonStatus

export type Vote = $Enums.Vote

export const Vote: typeof $Enums.Vote

export type Category = $Enums.Category

export const Category: typeof $Enums.Category

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.player`: Exposes CRUD operations for the **Player** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Players
    * const players = await prisma.player.findMany()
    * ```
    */
  get player(): Prisma.PlayerDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.gameScore`: Exposes CRUD operations for the **GameScore** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more GameScores
    * const gameScores = await prisma.gameScore.findMany()
    * ```
    */
  get gameScore(): Prisma.GameScoreDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.gallery`: Exposes CRUD operations for the **Gallery** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Galleries
    * const galleries = await prisma.gallery.findMany()
    * ```
    */
  get gallery(): Prisma.GalleryDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.season`: Exposes CRUD operations for the **Season** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Seasons
    * const seasons = await prisma.season.findMany()
    * ```
    */
  get season(): Prisma.SeasonDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.tournament`: Exposes CRUD operations for the **Tournament** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Tournaments
    * const tournaments = await prisma.tournament.findMany()
    * ```
    */
  get tournament(): Prisma.TournamentDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.pollVote`: Exposes CRUD operations for the **PollVote** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PollVotes
    * const pollVotes = await prisma.pollVote.findMany()
    * ```
    */
  get pollVote(): Prisma.PollVoteDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.tournamentWinner`: Exposes CRUD operations for the **TournamentWinner** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TournamentWinners
    * const tournamentWinners = await prisma.tournamentWinner.findMany()
    * ```
    */
  get tournamentWinner(): Prisma.TournamentWinnerDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.match`: Exposes CRUD operations for the **Match** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Matches
    * const matches = await prisma.match.findMany()
    * ```
    */
  get match(): Prisma.MatchDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.wallet`: Exposes CRUD operations for the **Wallet** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Wallets
    * const wallets = await prisma.wallet.findMany()
    * ```
    */
  get wallet(): Prisma.WalletDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.playerStats`: Exposes CRUD operations for the **PlayerStats** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PlayerStats
    * const playerStats = await prisma.playerStats.findMany()
    * ```
    */
  get playerStats(): Prisma.PlayerStatsDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.team`: Exposes CRUD operations for the **Team** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Teams
    * const teams = await prisma.team.findMany()
    * ```
    */
  get team(): Prisma.TeamDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.kDStats`: Exposes CRUD operations for the **KDStats** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more KDStats
    * const kDStats = await prisma.kDStats.findMany()
    * ```
    */
  get kDStats(): Prisma.KDStatsDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.17.0
   * Query Engine version: c0aafc03b8ef6cdced8654b9a817999e02457d6a
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    User: 'User',
    Player: 'Player',
    GameScore: 'GameScore',
    Gallery: 'Gallery',
    Season: 'Season',
    Tournament: 'Tournament',
    PollVote: 'PollVote',
    TournamentWinner: 'TournamentWinner',
    Match: 'Match',
    Wallet: 'Wallet',
    PlayerStats: 'PlayerStats',
    Team: 'Team',
    KDStats: 'KDStats'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "user" | "player" | "gameScore" | "gallery" | "season" | "tournament" | "pollVote" | "tournamentWinner" | "match" | "wallet" | "playerStats" | "team" | "kDStats"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UserUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      Player: {
        payload: Prisma.$PlayerPayload<ExtArgs>
        fields: Prisma.PlayerFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PlayerFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PlayerFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerPayload>
          }
          findFirst: {
            args: Prisma.PlayerFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PlayerFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerPayload>
          }
          findMany: {
            args: Prisma.PlayerFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerPayload>[]
          }
          create: {
            args: Prisma.PlayerCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerPayload>
          }
          createMany: {
            args: Prisma.PlayerCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PlayerCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerPayload>[]
          }
          delete: {
            args: Prisma.PlayerDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerPayload>
          }
          update: {
            args: Prisma.PlayerUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerPayload>
          }
          deleteMany: {
            args: Prisma.PlayerDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PlayerUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PlayerUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerPayload>[]
          }
          upsert: {
            args: Prisma.PlayerUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerPayload>
          }
          aggregate: {
            args: Prisma.PlayerAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePlayer>
          }
          groupBy: {
            args: Prisma.PlayerGroupByArgs<ExtArgs>
            result: $Utils.Optional<PlayerGroupByOutputType>[]
          }
          count: {
            args: Prisma.PlayerCountArgs<ExtArgs>
            result: $Utils.Optional<PlayerCountAggregateOutputType> | number
          }
        }
      }
      GameScore: {
        payload: Prisma.$GameScorePayload<ExtArgs>
        fields: Prisma.GameScoreFieldRefs
        operations: {
          findUnique: {
            args: Prisma.GameScoreFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameScorePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.GameScoreFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameScorePayload>
          }
          findFirst: {
            args: Prisma.GameScoreFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameScorePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.GameScoreFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameScorePayload>
          }
          findMany: {
            args: Prisma.GameScoreFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameScorePayload>[]
          }
          create: {
            args: Prisma.GameScoreCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameScorePayload>
          }
          createMany: {
            args: Prisma.GameScoreCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.GameScoreCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameScorePayload>[]
          }
          delete: {
            args: Prisma.GameScoreDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameScorePayload>
          }
          update: {
            args: Prisma.GameScoreUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameScorePayload>
          }
          deleteMany: {
            args: Prisma.GameScoreDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.GameScoreUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.GameScoreUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameScorePayload>[]
          }
          upsert: {
            args: Prisma.GameScoreUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameScorePayload>
          }
          aggregate: {
            args: Prisma.GameScoreAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateGameScore>
          }
          groupBy: {
            args: Prisma.GameScoreGroupByArgs<ExtArgs>
            result: $Utils.Optional<GameScoreGroupByOutputType>[]
          }
          count: {
            args: Prisma.GameScoreCountArgs<ExtArgs>
            result: $Utils.Optional<GameScoreCountAggregateOutputType> | number
          }
        }
      }
      Gallery: {
        payload: Prisma.$GalleryPayload<ExtArgs>
        fields: Prisma.GalleryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.GalleryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GalleryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.GalleryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GalleryPayload>
          }
          findFirst: {
            args: Prisma.GalleryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GalleryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.GalleryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GalleryPayload>
          }
          findMany: {
            args: Prisma.GalleryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GalleryPayload>[]
          }
          create: {
            args: Prisma.GalleryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GalleryPayload>
          }
          createMany: {
            args: Prisma.GalleryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.GalleryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GalleryPayload>[]
          }
          delete: {
            args: Prisma.GalleryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GalleryPayload>
          }
          update: {
            args: Prisma.GalleryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GalleryPayload>
          }
          deleteMany: {
            args: Prisma.GalleryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.GalleryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.GalleryUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GalleryPayload>[]
          }
          upsert: {
            args: Prisma.GalleryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GalleryPayload>
          }
          aggregate: {
            args: Prisma.GalleryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateGallery>
          }
          groupBy: {
            args: Prisma.GalleryGroupByArgs<ExtArgs>
            result: $Utils.Optional<GalleryGroupByOutputType>[]
          }
          count: {
            args: Prisma.GalleryCountArgs<ExtArgs>
            result: $Utils.Optional<GalleryCountAggregateOutputType> | number
          }
        }
      }
      Season: {
        payload: Prisma.$SeasonPayload<ExtArgs>
        fields: Prisma.SeasonFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SeasonFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SeasonPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SeasonFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SeasonPayload>
          }
          findFirst: {
            args: Prisma.SeasonFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SeasonPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SeasonFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SeasonPayload>
          }
          findMany: {
            args: Prisma.SeasonFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SeasonPayload>[]
          }
          create: {
            args: Prisma.SeasonCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SeasonPayload>
          }
          createMany: {
            args: Prisma.SeasonCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SeasonCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SeasonPayload>[]
          }
          delete: {
            args: Prisma.SeasonDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SeasonPayload>
          }
          update: {
            args: Prisma.SeasonUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SeasonPayload>
          }
          deleteMany: {
            args: Prisma.SeasonDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SeasonUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SeasonUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SeasonPayload>[]
          }
          upsert: {
            args: Prisma.SeasonUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SeasonPayload>
          }
          aggregate: {
            args: Prisma.SeasonAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSeason>
          }
          groupBy: {
            args: Prisma.SeasonGroupByArgs<ExtArgs>
            result: $Utils.Optional<SeasonGroupByOutputType>[]
          }
          count: {
            args: Prisma.SeasonCountArgs<ExtArgs>
            result: $Utils.Optional<SeasonCountAggregateOutputType> | number
          }
        }
      }
      Tournament: {
        payload: Prisma.$TournamentPayload<ExtArgs>
        fields: Prisma.TournamentFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TournamentFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TournamentPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TournamentFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TournamentPayload>
          }
          findFirst: {
            args: Prisma.TournamentFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TournamentPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TournamentFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TournamentPayload>
          }
          findMany: {
            args: Prisma.TournamentFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TournamentPayload>[]
          }
          create: {
            args: Prisma.TournamentCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TournamentPayload>
          }
          createMany: {
            args: Prisma.TournamentCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TournamentCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TournamentPayload>[]
          }
          delete: {
            args: Prisma.TournamentDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TournamentPayload>
          }
          update: {
            args: Prisma.TournamentUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TournamentPayload>
          }
          deleteMany: {
            args: Prisma.TournamentDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TournamentUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TournamentUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TournamentPayload>[]
          }
          upsert: {
            args: Prisma.TournamentUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TournamentPayload>
          }
          aggregate: {
            args: Prisma.TournamentAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTournament>
          }
          groupBy: {
            args: Prisma.TournamentGroupByArgs<ExtArgs>
            result: $Utils.Optional<TournamentGroupByOutputType>[]
          }
          count: {
            args: Prisma.TournamentCountArgs<ExtArgs>
            result: $Utils.Optional<TournamentCountAggregateOutputType> | number
          }
        }
      }
      PollVote: {
        payload: Prisma.$PollVotePayload<ExtArgs>
        fields: Prisma.PollVoteFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PollVoteFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PollVotePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PollVoteFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PollVotePayload>
          }
          findFirst: {
            args: Prisma.PollVoteFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PollVotePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PollVoteFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PollVotePayload>
          }
          findMany: {
            args: Prisma.PollVoteFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PollVotePayload>[]
          }
          create: {
            args: Prisma.PollVoteCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PollVotePayload>
          }
          createMany: {
            args: Prisma.PollVoteCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PollVoteCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PollVotePayload>[]
          }
          delete: {
            args: Prisma.PollVoteDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PollVotePayload>
          }
          update: {
            args: Prisma.PollVoteUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PollVotePayload>
          }
          deleteMany: {
            args: Prisma.PollVoteDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PollVoteUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PollVoteUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PollVotePayload>[]
          }
          upsert: {
            args: Prisma.PollVoteUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PollVotePayload>
          }
          aggregate: {
            args: Prisma.PollVoteAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePollVote>
          }
          groupBy: {
            args: Prisma.PollVoteGroupByArgs<ExtArgs>
            result: $Utils.Optional<PollVoteGroupByOutputType>[]
          }
          count: {
            args: Prisma.PollVoteCountArgs<ExtArgs>
            result: $Utils.Optional<PollVoteCountAggregateOutputType> | number
          }
        }
      }
      TournamentWinner: {
        payload: Prisma.$TournamentWinnerPayload<ExtArgs>
        fields: Prisma.TournamentWinnerFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TournamentWinnerFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TournamentWinnerPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TournamentWinnerFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TournamentWinnerPayload>
          }
          findFirst: {
            args: Prisma.TournamentWinnerFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TournamentWinnerPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TournamentWinnerFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TournamentWinnerPayload>
          }
          findMany: {
            args: Prisma.TournamentWinnerFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TournamentWinnerPayload>[]
          }
          create: {
            args: Prisma.TournamentWinnerCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TournamentWinnerPayload>
          }
          createMany: {
            args: Prisma.TournamentWinnerCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TournamentWinnerCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TournamentWinnerPayload>[]
          }
          delete: {
            args: Prisma.TournamentWinnerDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TournamentWinnerPayload>
          }
          update: {
            args: Prisma.TournamentWinnerUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TournamentWinnerPayload>
          }
          deleteMany: {
            args: Prisma.TournamentWinnerDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TournamentWinnerUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TournamentWinnerUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TournamentWinnerPayload>[]
          }
          upsert: {
            args: Prisma.TournamentWinnerUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TournamentWinnerPayload>
          }
          aggregate: {
            args: Prisma.TournamentWinnerAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTournamentWinner>
          }
          groupBy: {
            args: Prisma.TournamentWinnerGroupByArgs<ExtArgs>
            result: $Utils.Optional<TournamentWinnerGroupByOutputType>[]
          }
          count: {
            args: Prisma.TournamentWinnerCountArgs<ExtArgs>
            result: $Utils.Optional<TournamentWinnerCountAggregateOutputType> | number
          }
        }
      }
      Match: {
        payload: Prisma.$MatchPayload<ExtArgs>
        fields: Prisma.MatchFieldRefs
        operations: {
          findUnique: {
            args: Prisma.MatchFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.MatchFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchPayload>
          }
          findFirst: {
            args: Prisma.MatchFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.MatchFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchPayload>
          }
          findMany: {
            args: Prisma.MatchFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchPayload>[]
          }
          create: {
            args: Prisma.MatchCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchPayload>
          }
          createMany: {
            args: Prisma.MatchCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.MatchCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchPayload>[]
          }
          delete: {
            args: Prisma.MatchDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchPayload>
          }
          update: {
            args: Prisma.MatchUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchPayload>
          }
          deleteMany: {
            args: Prisma.MatchDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.MatchUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.MatchUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchPayload>[]
          }
          upsert: {
            args: Prisma.MatchUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchPayload>
          }
          aggregate: {
            args: Prisma.MatchAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateMatch>
          }
          groupBy: {
            args: Prisma.MatchGroupByArgs<ExtArgs>
            result: $Utils.Optional<MatchGroupByOutputType>[]
          }
          count: {
            args: Prisma.MatchCountArgs<ExtArgs>
            result: $Utils.Optional<MatchCountAggregateOutputType> | number
          }
        }
      }
      Wallet: {
        payload: Prisma.$WalletPayload<ExtArgs>
        fields: Prisma.WalletFieldRefs
        operations: {
          findUnique: {
            args: Prisma.WalletFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.WalletFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletPayload>
          }
          findFirst: {
            args: Prisma.WalletFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.WalletFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletPayload>
          }
          findMany: {
            args: Prisma.WalletFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletPayload>[]
          }
          create: {
            args: Prisma.WalletCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletPayload>
          }
          createMany: {
            args: Prisma.WalletCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.WalletCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletPayload>[]
          }
          delete: {
            args: Prisma.WalletDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletPayload>
          }
          update: {
            args: Prisma.WalletUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletPayload>
          }
          deleteMany: {
            args: Prisma.WalletDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.WalletUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.WalletUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletPayload>[]
          }
          upsert: {
            args: Prisma.WalletUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletPayload>
          }
          aggregate: {
            args: Prisma.WalletAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateWallet>
          }
          groupBy: {
            args: Prisma.WalletGroupByArgs<ExtArgs>
            result: $Utils.Optional<WalletGroupByOutputType>[]
          }
          count: {
            args: Prisma.WalletCountArgs<ExtArgs>
            result: $Utils.Optional<WalletCountAggregateOutputType> | number
          }
        }
      }
      PlayerStats: {
        payload: Prisma.$PlayerStatsPayload<ExtArgs>
        fields: Prisma.PlayerStatsFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PlayerStatsFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerStatsPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PlayerStatsFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerStatsPayload>
          }
          findFirst: {
            args: Prisma.PlayerStatsFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerStatsPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PlayerStatsFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerStatsPayload>
          }
          findMany: {
            args: Prisma.PlayerStatsFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerStatsPayload>[]
          }
          create: {
            args: Prisma.PlayerStatsCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerStatsPayload>
          }
          createMany: {
            args: Prisma.PlayerStatsCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PlayerStatsCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerStatsPayload>[]
          }
          delete: {
            args: Prisma.PlayerStatsDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerStatsPayload>
          }
          update: {
            args: Prisma.PlayerStatsUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerStatsPayload>
          }
          deleteMany: {
            args: Prisma.PlayerStatsDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PlayerStatsUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PlayerStatsUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerStatsPayload>[]
          }
          upsert: {
            args: Prisma.PlayerStatsUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PlayerStatsPayload>
          }
          aggregate: {
            args: Prisma.PlayerStatsAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePlayerStats>
          }
          groupBy: {
            args: Prisma.PlayerStatsGroupByArgs<ExtArgs>
            result: $Utils.Optional<PlayerStatsGroupByOutputType>[]
          }
          count: {
            args: Prisma.PlayerStatsCountArgs<ExtArgs>
            result: $Utils.Optional<PlayerStatsCountAggregateOutputType> | number
          }
        }
      }
      Team: {
        payload: Prisma.$TeamPayload<ExtArgs>
        fields: Prisma.TeamFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TeamFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TeamFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamPayload>
          }
          findFirst: {
            args: Prisma.TeamFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TeamFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamPayload>
          }
          findMany: {
            args: Prisma.TeamFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamPayload>[]
          }
          create: {
            args: Prisma.TeamCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamPayload>
          }
          createMany: {
            args: Prisma.TeamCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TeamCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamPayload>[]
          }
          delete: {
            args: Prisma.TeamDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamPayload>
          }
          update: {
            args: Prisma.TeamUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamPayload>
          }
          deleteMany: {
            args: Prisma.TeamDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TeamUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TeamUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamPayload>[]
          }
          upsert: {
            args: Prisma.TeamUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamPayload>
          }
          aggregate: {
            args: Prisma.TeamAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTeam>
          }
          groupBy: {
            args: Prisma.TeamGroupByArgs<ExtArgs>
            result: $Utils.Optional<TeamGroupByOutputType>[]
          }
          count: {
            args: Prisma.TeamCountArgs<ExtArgs>
            result: $Utils.Optional<TeamCountAggregateOutputType> | number
          }
        }
      }
      KDStats: {
        payload: Prisma.$KDStatsPayload<ExtArgs>
        fields: Prisma.KDStatsFieldRefs
        operations: {
          findUnique: {
            args: Prisma.KDStatsFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KDStatsPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.KDStatsFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KDStatsPayload>
          }
          findFirst: {
            args: Prisma.KDStatsFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KDStatsPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.KDStatsFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KDStatsPayload>
          }
          findMany: {
            args: Prisma.KDStatsFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KDStatsPayload>[]
          }
          create: {
            args: Prisma.KDStatsCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KDStatsPayload>
          }
          createMany: {
            args: Prisma.KDStatsCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.KDStatsCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KDStatsPayload>[]
          }
          delete: {
            args: Prisma.KDStatsDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KDStatsPayload>
          }
          update: {
            args: Prisma.KDStatsUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KDStatsPayload>
          }
          deleteMany: {
            args: Prisma.KDStatsDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.KDStatsUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.KDStatsUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KDStatsPayload>[]
          }
          upsert: {
            args: Prisma.KDStatsUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KDStatsPayload>
          }
          aggregate: {
            args: Prisma.KDStatsAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateKDStats>
          }
          groupBy: {
            args: Prisma.KDStatsGroupByArgs<ExtArgs>
            result: $Utils.Optional<KDStatsGroupByOutputType>[]
          }
          count: {
            args: Prisma.KDStatsCountArgs<ExtArgs>
            result: $Utils.Optional<KDStatsCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory | null
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    user?: UserOmit
    player?: PlayerOmit
    gameScore?: GameScoreOmit
    gallery?: GalleryOmit
    season?: SeasonOmit
    tournament?: TournamentOmit
    pollVote?: PollVoteOmit
    tournamentWinner?: TournamentWinnerOmit
    match?: MatchOmit
    wallet?: WalletOmit
    playerStats?: PlayerStatsOmit
    team?: TeamOmit
    kDStats?: KDStatsOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type PlayerCountOutputType
   */

  export type PlayerCountOutputType = {
    gameScore: number
    tournamentWinner: number
  }

  export type PlayerCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    gameScore?: boolean | PlayerCountOutputTypeCountGameScoreArgs
    tournamentWinner?: boolean | PlayerCountOutputTypeCountTournamentWinnerArgs
  }

  // Custom InputTypes
  /**
   * PlayerCountOutputType without action
   */
  export type PlayerCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlayerCountOutputType
     */
    select?: PlayerCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * PlayerCountOutputType without action
   */
  export type PlayerCountOutputTypeCountGameScoreArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: GameScoreWhereInput
  }

  /**
   * PlayerCountOutputType without action
   */
  export type PlayerCountOutputTypeCountTournamentWinnerArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TournamentWinnerWhereInput
  }


  /**
   * Count Type GalleryCountOutputType
   */

  export type GalleryCountOutputType = {
    tournament: number
  }

  export type GalleryCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tournament?: boolean | GalleryCountOutputTypeCountTournamentArgs
  }

  // Custom InputTypes
  /**
   * GalleryCountOutputType without action
   */
  export type GalleryCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GalleryCountOutputType
     */
    select?: GalleryCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * GalleryCountOutputType without action
   */
  export type GalleryCountOutputTypeCountTournamentArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TournamentWhereInput
  }


  /**
   * Count Type SeasonCountOutputType
   */

  export type SeasonCountOutputType = {
    tournament: number
  }

  export type SeasonCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tournament?: boolean | SeasonCountOutputTypeCountTournamentArgs
  }

  // Custom InputTypes
  /**
   * SeasonCountOutputType without action
   */
  export type SeasonCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SeasonCountOutputType
     */
    select?: SeasonCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * SeasonCountOutputType without action
   */
  export type SeasonCountOutputTypeCountTournamentArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TournamentWhereInput
  }


  /**
   * Count Type TournamentCountOutputType
   */

  export type TournamentCountOutputType = {
    team: number
    user: number
    tournamentWinner: number
    pollVote: number
    match: number
  }

  export type TournamentCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    team?: boolean | TournamentCountOutputTypeCountTeamArgs
    user?: boolean | TournamentCountOutputTypeCountUserArgs
    tournamentWinner?: boolean | TournamentCountOutputTypeCountTournamentWinnerArgs
    pollVote?: boolean | TournamentCountOutputTypeCountPollVoteArgs
    match?: boolean | TournamentCountOutputTypeCountMatchArgs
  }

  // Custom InputTypes
  /**
   * TournamentCountOutputType without action
   */
  export type TournamentCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TournamentCountOutputType
     */
    select?: TournamentCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * TournamentCountOutputType without action
   */
  export type TournamentCountOutputTypeCountTeamArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TeamWhereInput
  }

  /**
   * TournamentCountOutputType without action
   */
  export type TournamentCountOutputTypeCountUserArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
  }

  /**
   * TournamentCountOutputType without action
   */
  export type TournamentCountOutputTypeCountTournamentWinnerArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TournamentWinnerWhereInput
  }

  /**
   * TournamentCountOutputType without action
   */
  export type TournamentCountOutputTypeCountPollVoteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PollVoteWhereInput
  }

  /**
   * TournamentCountOutputType without action
   */
  export type TournamentCountOutputTypeCountMatchArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MatchWhereInput
  }


  /**
   * Count Type TeamCountOutputType
   */

  export type TeamCountOutputType = {
    players: number
  }

  export type TeamCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    players?: boolean | TeamCountOutputTypeCountPlayersArgs
  }

  // Custom InputTypes
  /**
   * TeamCountOutputType without action
   */
  export type TeamCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeamCountOutputType
     */
    select?: TeamCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * TeamCountOutputType without action
   */
  export type TeamCountOutputTypeCountPlayersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PlayerWhereInput
  }


  /**
   * Models
   */

  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserAvgAggregateOutputType = {
    balance: number | null
  }

  export type UserSumAggregateOutputType = {
    balance: number | null
  }

  export type UserMinAggregateOutputType = {
    id: string | null
    email: string | null
    clerkId: string | null
    isEmailLinked: boolean | null
    userName: string | null
    usernameLastChangeAt: Date | null
    role: $Enums.Role | null
    balance: number | null
    isInternal: boolean | null
    isVerified: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
    playerId: string | null
    tournamentId: string | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    email: string | null
    clerkId: string | null
    isEmailLinked: boolean | null
    userName: string | null
    usernameLastChangeAt: Date | null
    role: $Enums.Role | null
    balance: number | null
    isInternal: boolean | null
    isVerified: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
    playerId: string | null
    tournamentId: string | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    email: number
    clerkId: number
    isEmailLinked: number
    userName: number
    usernameLastChangeAt: number
    role: number
    balance: number
    isInternal: number
    isVerified: number
    createdAt: number
    updatedAt: number
    playerId: number
    tournamentId: number
    _all: number
  }


  export type UserAvgAggregateInputType = {
    balance?: true
  }

  export type UserSumAggregateInputType = {
    balance?: true
  }

  export type UserMinAggregateInputType = {
    id?: true
    email?: true
    clerkId?: true
    isEmailLinked?: true
    userName?: true
    usernameLastChangeAt?: true
    role?: true
    balance?: true
    isInternal?: true
    isVerified?: true
    createdAt?: true
    updatedAt?: true
    playerId?: true
    tournamentId?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    email?: true
    clerkId?: true
    isEmailLinked?: true
    userName?: true
    usernameLastChangeAt?: true
    role?: true
    balance?: true
    isInternal?: true
    isVerified?: true
    createdAt?: true
    updatedAt?: true
    playerId?: true
    tournamentId?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    email?: true
    clerkId?: true
    isEmailLinked?: true
    userName?: true
    usernameLastChangeAt?: true
    role?: true
    balance?: true
    isInternal?: true
    isVerified?: true
    createdAt?: true
    updatedAt?: true
    playerId?: true
    tournamentId?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: UserAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: UserSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _avg?: UserAvgAggregateInputType
    _sum?: UserSumAggregateInputType
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: string
    email: string | null
    clerkId: string
    isEmailLinked: boolean
    userName: string
    usernameLastChangeAt: Date
    role: $Enums.Role
    balance: number
    isInternal: boolean
    isVerified: boolean
    createdAt: Date
    updatedAt: Date
    playerId: string | null
    tournamentId: string | null
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    clerkId?: boolean
    isEmailLinked?: boolean
    userName?: boolean
    usernameLastChangeAt?: boolean
    role?: boolean
    balance?: boolean
    isInternal?: boolean
    isVerified?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    playerId?: boolean
    tournamentId?: boolean
    player?: boolean | User$playerArgs<ExtArgs>
    tournament?: boolean | User$tournamentArgs<ExtArgs>
    wallet?: boolean | User$walletArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    clerkId?: boolean
    isEmailLinked?: boolean
    userName?: boolean
    usernameLastChangeAt?: boolean
    role?: boolean
    balance?: boolean
    isInternal?: boolean
    isVerified?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    playerId?: boolean
    tournamentId?: boolean
    tournament?: boolean | User$tournamentArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    clerkId?: boolean
    isEmailLinked?: boolean
    userName?: boolean
    usernameLastChangeAt?: boolean
    role?: boolean
    balance?: boolean
    isInternal?: boolean
    isVerified?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    playerId?: boolean
    tournamentId?: boolean
    tournament?: boolean | User$tournamentArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    email?: boolean
    clerkId?: boolean
    isEmailLinked?: boolean
    userName?: boolean
    usernameLastChangeAt?: boolean
    role?: boolean
    balance?: boolean
    isInternal?: boolean
    isVerified?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    playerId?: boolean
    tournamentId?: boolean
  }

  export type UserOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "email" | "clerkId" | "isEmailLinked" | "userName" | "usernameLastChangeAt" | "role" | "balance" | "isInternal" | "isVerified" | "createdAt" | "updatedAt" | "playerId" | "tournamentId", ExtArgs["result"]["user"]>
  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    player?: boolean | User$playerArgs<ExtArgs>
    tournament?: boolean | User$tournamentArgs<ExtArgs>
    wallet?: boolean | User$walletArgs<ExtArgs>
  }
  export type UserIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tournament?: boolean | User$tournamentArgs<ExtArgs>
  }
  export type UserIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tournament?: boolean | User$tournamentArgs<ExtArgs>
  }

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      player: Prisma.$PlayerPayload<ExtArgs> | null
      tournament: Prisma.$TournamentPayload<ExtArgs> | null
      wallet: Prisma.$WalletPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      email: string | null
      clerkId: string
      isEmailLinked: boolean
      userName: string
      usernameLastChangeAt: Date
      role: $Enums.Role
      balance: number
      isInternal: boolean
      isVerified: boolean
      createdAt: Date
      updatedAt: Date
      playerId: string | null
      tournamentId: string | null
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users and returns the data updated in the database.
     * @param {UserUpdateManyAndReturnArgs} args - Arguments to update many Users.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Users and only return the `id`
     * const userWithIdOnly = await prisma.user.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends UserUpdateManyAndReturnArgs>(args: SelectSubset<T, UserUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    player<T extends User$playerArgs<ExtArgs> = {}>(args?: Subset<T, User$playerArgs<ExtArgs>>): Prisma__PlayerClient<$Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    tournament<T extends User$tournamentArgs<ExtArgs> = {}>(args?: Subset<T, User$tournamentArgs<ExtArgs>>): Prisma__TournamentClient<$Result.GetResult<Prisma.$TournamentPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    wallet<T extends User$walletArgs<ExtArgs> = {}>(args?: Subset<T, User$walletArgs<ExtArgs>>): Prisma__WalletClient<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'String'>
    readonly email: FieldRef<"User", 'String'>
    readonly clerkId: FieldRef<"User", 'String'>
    readonly isEmailLinked: FieldRef<"User", 'Boolean'>
    readonly userName: FieldRef<"User", 'String'>
    readonly usernameLastChangeAt: FieldRef<"User", 'DateTime'>
    readonly role: FieldRef<"User", 'Role'>
    readonly balance: FieldRef<"User", 'Int'>
    readonly isInternal: FieldRef<"User", 'Boolean'>
    readonly isVerified: FieldRef<"User", 'Boolean'>
    readonly createdAt: FieldRef<"User", 'DateTime'>
    readonly updatedAt: FieldRef<"User", 'DateTime'>
    readonly playerId: FieldRef<"User", 'String'>
    readonly tournamentId: FieldRef<"User", 'String'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User updateManyAndReturn
   */
  export type UserUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to delete.
     */
    limit?: number
  }

  /**
   * User.player
   */
  export type User$playerArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Player
     */
    select?: PlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Player
     */
    omit?: PlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerInclude<ExtArgs> | null
    where?: PlayerWhereInput
  }

  /**
   * User.tournament
   */
  export type User$tournamentArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tournament
     */
    select?: TournamentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tournament
     */
    omit?: TournamentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TournamentInclude<ExtArgs> | null
    where?: TournamentWhereInput
  }

  /**
   * User.wallet
   */
  export type User$walletArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Wallet
     */
    omit?: WalletOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletInclude<ExtArgs> | null
    where?: WalletWhereInput
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model Player
   */

  export type AggregatePlayer = {
    _count: PlayerCountAggregateOutputType | null
    _min: PlayerMinAggregateOutputType | null
    _max: PlayerMaxAggregateOutputType | null
  }

  export type PlayerMinAggregateOutputType = {
    id: string | null
    isBanned: boolean | null
    category: $Enums.PlayerCategory | null
    userId: string | null
    teamId: string | null
    characterImageId: string | null
  }

  export type PlayerMaxAggregateOutputType = {
    id: string | null
    isBanned: boolean | null
    category: $Enums.PlayerCategory | null
    userId: string | null
    teamId: string | null
    characterImageId: string | null
  }

  export type PlayerCountAggregateOutputType = {
    id: number
    isBanned: number
    category: number
    userId: number
    teamId: number
    characterImageId: number
    _all: number
  }


  export type PlayerMinAggregateInputType = {
    id?: true
    isBanned?: true
    category?: true
    userId?: true
    teamId?: true
    characterImageId?: true
  }

  export type PlayerMaxAggregateInputType = {
    id?: true
    isBanned?: true
    category?: true
    userId?: true
    teamId?: true
    characterImageId?: true
  }

  export type PlayerCountAggregateInputType = {
    id?: true
    isBanned?: true
    category?: true
    userId?: true
    teamId?: true
    characterImageId?: true
    _all?: true
  }

  export type PlayerAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Player to aggregate.
     */
    where?: PlayerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Players to fetch.
     */
    orderBy?: PlayerOrderByWithRelationInput | PlayerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PlayerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Players from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Players.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Players
    **/
    _count?: true | PlayerCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PlayerMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PlayerMaxAggregateInputType
  }

  export type GetPlayerAggregateType<T extends PlayerAggregateArgs> = {
        [P in keyof T & keyof AggregatePlayer]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePlayer[P]>
      : GetScalarType<T[P], AggregatePlayer[P]>
  }




  export type PlayerGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PlayerWhereInput
    orderBy?: PlayerOrderByWithAggregationInput | PlayerOrderByWithAggregationInput[]
    by: PlayerScalarFieldEnum[] | PlayerScalarFieldEnum
    having?: PlayerScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PlayerCountAggregateInputType | true
    _min?: PlayerMinAggregateInputType
    _max?: PlayerMaxAggregateInputType
  }

  export type PlayerGroupByOutputType = {
    id: string
    isBanned: boolean
    category: $Enums.PlayerCategory
    userId: string
    teamId: string | null
    characterImageId: string | null
    _count: PlayerCountAggregateOutputType | null
    _min: PlayerMinAggregateOutputType | null
    _max: PlayerMaxAggregateOutputType | null
  }

  type GetPlayerGroupByPayload<T extends PlayerGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PlayerGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PlayerGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PlayerGroupByOutputType[P]>
            : GetScalarType<T[P], PlayerGroupByOutputType[P]>
        }
      >
    >


  export type PlayerSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    isBanned?: boolean
    category?: boolean
    userId?: boolean
    teamId?: boolean
    characterImageId?: boolean
    gameScore?: boolean | Player$gameScoreArgs<ExtArgs>
    pollVote?: boolean | Player$pollVoteArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
    tournamentWinner?: boolean | Player$tournamentWinnerArgs<ExtArgs>
    Wallet?: boolean | Player$WalletArgs<ExtArgs>
    playerStats?: boolean | Player$playerStatsArgs<ExtArgs>
    team?: boolean | Player$teamArgs<ExtArgs>
    characterImage?: boolean | Player$characterImageArgs<ExtArgs>
    _count?: boolean | PlayerCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["player"]>

  export type PlayerSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    isBanned?: boolean
    category?: boolean
    userId?: boolean
    teamId?: boolean
    characterImageId?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    team?: boolean | Player$teamArgs<ExtArgs>
    characterImage?: boolean | Player$characterImageArgs<ExtArgs>
  }, ExtArgs["result"]["player"]>

  export type PlayerSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    isBanned?: boolean
    category?: boolean
    userId?: boolean
    teamId?: boolean
    characterImageId?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    team?: boolean | Player$teamArgs<ExtArgs>
    characterImage?: boolean | Player$characterImageArgs<ExtArgs>
  }, ExtArgs["result"]["player"]>

  export type PlayerSelectScalar = {
    id?: boolean
    isBanned?: boolean
    category?: boolean
    userId?: boolean
    teamId?: boolean
    characterImageId?: boolean
  }

  export type PlayerOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "isBanned" | "category" | "userId" | "teamId" | "characterImageId", ExtArgs["result"]["player"]>
  export type PlayerInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    gameScore?: boolean | Player$gameScoreArgs<ExtArgs>
    pollVote?: boolean | Player$pollVoteArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
    tournamentWinner?: boolean | Player$tournamentWinnerArgs<ExtArgs>
    Wallet?: boolean | Player$WalletArgs<ExtArgs>
    playerStats?: boolean | Player$playerStatsArgs<ExtArgs>
    team?: boolean | Player$teamArgs<ExtArgs>
    characterImage?: boolean | Player$characterImageArgs<ExtArgs>
    _count?: boolean | PlayerCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type PlayerIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    team?: boolean | Player$teamArgs<ExtArgs>
    characterImage?: boolean | Player$characterImageArgs<ExtArgs>
  }
  export type PlayerIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    team?: boolean | Player$teamArgs<ExtArgs>
    characterImage?: boolean | Player$characterImageArgs<ExtArgs>
  }

  export type $PlayerPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Player"
    objects: {
      gameScore: Prisma.$GameScorePayload<ExtArgs>[]
      pollVote: Prisma.$PollVotePayload<ExtArgs> | null
      user: Prisma.$UserPayload<ExtArgs>
      tournamentWinner: Prisma.$TournamentWinnerPayload<ExtArgs>[]
      Wallet: Prisma.$WalletPayload<ExtArgs> | null
      playerStats: Prisma.$PlayerStatsPayload<ExtArgs> | null
      team: Prisma.$TeamPayload<ExtArgs> | null
      characterImage: Prisma.$GalleryPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      isBanned: boolean
      category: $Enums.PlayerCategory
      userId: string
      teamId: string | null
      characterImageId: string | null
    }, ExtArgs["result"]["player"]>
    composites: {}
  }

  type PlayerGetPayload<S extends boolean | null | undefined | PlayerDefaultArgs> = $Result.GetResult<Prisma.$PlayerPayload, S>

  type PlayerCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PlayerFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PlayerCountAggregateInputType | true
    }

  export interface PlayerDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Player'], meta: { name: 'Player' } }
    /**
     * Find zero or one Player that matches the filter.
     * @param {PlayerFindUniqueArgs} args - Arguments to find a Player
     * @example
     * // Get one Player
     * const player = await prisma.player.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PlayerFindUniqueArgs>(args: SelectSubset<T, PlayerFindUniqueArgs<ExtArgs>>): Prisma__PlayerClient<$Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Player that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PlayerFindUniqueOrThrowArgs} args - Arguments to find a Player
     * @example
     * // Get one Player
     * const player = await prisma.player.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PlayerFindUniqueOrThrowArgs>(args: SelectSubset<T, PlayerFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PlayerClient<$Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Player that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlayerFindFirstArgs} args - Arguments to find a Player
     * @example
     * // Get one Player
     * const player = await prisma.player.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PlayerFindFirstArgs>(args?: SelectSubset<T, PlayerFindFirstArgs<ExtArgs>>): Prisma__PlayerClient<$Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Player that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlayerFindFirstOrThrowArgs} args - Arguments to find a Player
     * @example
     * // Get one Player
     * const player = await prisma.player.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PlayerFindFirstOrThrowArgs>(args?: SelectSubset<T, PlayerFindFirstOrThrowArgs<ExtArgs>>): Prisma__PlayerClient<$Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Players that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlayerFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Players
     * const players = await prisma.player.findMany()
     * 
     * // Get first 10 Players
     * const players = await prisma.player.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const playerWithIdOnly = await prisma.player.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PlayerFindManyArgs>(args?: SelectSubset<T, PlayerFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Player.
     * @param {PlayerCreateArgs} args - Arguments to create a Player.
     * @example
     * // Create one Player
     * const Player = await prisma.player.create({
     *   data: {
     *     // ... data to create a Player
     *   }
     * })
     * 
     */
    create<T extends PlayerCreateArgs>(args: SelectSubset<T, PlayerCreateArgs<ExtArgs>>): Prisma__PlayerClient<$Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Players.
     * @param {PlayerCreateManyArgs} args - Arguments to create many Players.
     * @example
     * // Create many Players
     * const player = await prisma.player.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PlayerCreateManyArgs>(args?: SelectSubset<T, PlayerCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Players and returns the data saved in the database.
     * @param {PlayerCreateManyAndReturnArgs} args - Arguments to create many Players.
     * @example
     * // Create many Players
     * const player = await prisma.player.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Players and only return the `id`
     * const playerWithIdOnly = await prisma.player.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PlayerCreateManyAndReturnArgs>(args?: SelectSubset<T, PlayerCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Player.
     * @param {PlayerDeleteArgs} args - Arguments to delete one Player.
     * @example
     * // Delete one Player
     * const Player = await prisma.player.delete({
     *   where: {
     *     // ... filter to delete one Player
     *   }
     * })
     * 
     */
    delete<T extends PlayerDeleteArgs>(args: SelectSubset<T, PlayerDeleteArgs<ExtArgs>>): Prisma__PlayerClient<$Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Player.
     * @param {PlayerUpdateArgs} args - Arguments to update one Player.
     * @example
     * // Update one Player
     * const player = await prisma.player.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PlayerUpdateArgs>(args: SelectSubset<T, PlayerUpdateArgs<ExtArgs>>): Prisma__PlayerClient<$Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Players.
     * @param {PlayerDeleteManyArgs} args - Arguments to filter Players to delete.
     * @example
     * // Delete a few Players
     * const { count } = await prisma.player.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PlayerDeleteManyArgs>(args?: SelectSubset<T, PlayerDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Players.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlayerUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Players
     * const player = await prisma.player.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PlayerUpdateManyArgs>(args: SelectSubset<T, PlayerUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Players and returns the data updated in the database.
     * @param {PlayerUpdateManyAndReturnArgs} args - Arguments to update many Players.
     * @example
     * // Update many Players
     * const player = await prisma.player.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Players and only return the `id`
     * const playerWithIdOnly = await prisma.player.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PlayerUpdateManyAndReturnArgs>(args: SelectSubset<T, PlayerUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Player.
     * @param {PlayerUpsertArgs} args - Arguments to update or create a Player.
     * @example
     * // Update or create a Player
     * const player = await prisma.player.upsert({
     *   create: {
     *     // ... data to create a Player
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Player we want to update
     *   }
     * })
     */
    upsert<T extends PlayerUpsertArgs>(args: SelectSubset<T, PlayerUpsertArgs<ExtArgs>>): Prisma__PlayerClient<$Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Players.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlayerCountArgs} args - Arguments to filter Players to count.
     * @example
     * // Count the number of Players
     * const count = await prisma.player.count({
     *   where: {
     *     // ... the filter for the Players we want to count
     *   }
     * })
    **/
    count<T extends PlayerCountArgs>(
      args?: Subset<T, PlayerCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PlayerCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Player.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlayerAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PlayerAggregateArgs>(args: Subset<T, PlayerAggregateArgs>): Prisma.PrismaPromise<GetPlayerAggregateType<T>>

    /**
     * Group by Player.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlayerGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PlayerGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PlayerGroupByArgs['orderBy'] }
        : { orderBy?: PlayerGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PlayerGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPlayerGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Player model
   */
  readonly fields: PlayerFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Player.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PlayerClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    gameScore<T extends Player$gameScoreArgs<ExtArgs> = {}>(args?: Subset<T, Player$gameScoreArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GameScorePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    pollVote<T extends Player$pollVoteArgs<ExtArgs> = {}>(args?: Subset<T, Player$pollVoteArgs<ExtArgs>>): Prisma__PollVoteClient<$Result.GetResult<Prisma.$PollVotePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    tournamentWinner<T extends Player$tournamentWinnerArgs<ExtArgs> = {}>(args?: Subset<T, Player$tournamentWinnerArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TournamentWinnerPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    Wallet<T extends Player$WalletArgs<ExtArgs> = {}>(args?: Subset<T, Player$WalletArgs<ExtArgs>>): Prisma__WalletClient<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    playerStats<T extends Player$playerStatsArgs<ExtArgs> = {}>(args?: Subset<T, Player$playerStatsArgs<ExtArgs>>): Prisma__PlayerStatsClient<$Result.GetResult<Prisma.$PlayerStatsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    team<T extends Player$teamArgs<ExtArgs> = {}>(args?: Subset<T, Player$teamArgs<ExtArgs>>): Prisma__TeamClient<$Result.GetResult<Prisma.$TeamPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    characterImage<T extends Player$characterImageArgs<ExtArgs> = {}>(args?: Subset<T, Player$characterImageArgs<ExtArgs>>): Prisma__GalleryClient<$Result.GetResult<Prisma.$GalleryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Player model
   */
  interface PlayerFieldRefs {
    readonly id: FieldRef<"Player", 'String'>
    readonly isBanned: FieldRef<"Player", 'Boolean'>
    readonly category: FieldRef<"Player", 'PlayerCategory'>
    readonly userId: FieldRef<"Player", 'String'>
    readonly teamId: FieldRef<"Player", 'String'>
    readonly characterImageId: FieldRef<"Player", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Player findUnique
   */
  export type PlayerFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Player
     */
    select?: PlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Player
     */
    omit?: PlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerInclude<ExtArgs> | null
    /**
     * Filter, which Player to fetch.
     */
    where: PlayerWhereUniqueInput
  }

  /**
   * Player findUniqueOrThrow
   */
  export type PlayerFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Player
     */
    select?: PlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Player
     */
    omit?: PlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerInclude<ExtArgs> | null
    /**
     * Filter, which Player to fetch.
     */
    where: PlayerWhereUniqueInput
  }

  /**
   * Player findFirst
   */
  export type PlayerFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Player
     */
    select?: PlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Player
     */
    omit?: PlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerInclude<ExtArgs> | null
    /**
     * Filter, which Player to fetch.
     */
    where?: PlayerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Players to fetch.
     */
    orderBy?: PlayerOrderByWithRelationInput | PlayerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Players.
     */
    cursor?: PlayerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Players from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Players.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Players.
     */
    distinct?: PlayerScalarFieldEnum | PlayerScalarFieldEnum[]
  }

  /**
   * Player findFirstOrThrow
   */
  export type PlayerFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Player
     */
    select?: PlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Player
     */
    omit?: PlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerInclude<ExtArgs> | null
    /**
     * Filter, which Player to fetch.
     */
    where?: PlayerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Players to fetch.
     */
    orderBy?: PlayerOrderByWithRelationInput | PlayerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Players.
     */
    cursor?: PlayerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Players from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Players.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Players.
     */
    distinct?: PlayerScalarFieldEnum | PlayerScalarFieldEnum[]
  }

  /**
   * Player findMany
   */
  export type PlayerFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Player
     */
    select?: PlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Player
     */
    omit?: PlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerInclude<ExtArgs> | null
    /**
     * Filter, which Players to fetch.
     */
    where?: PlayerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Players to fetch.
     */
    orderBy?: PlayerOrderByWithRelationInput | PlayerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Players.
     */
    cursor?: PlayerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Players from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Players.
     */
    skip?: number
    distinct?: PlayerScalarFieldEnum | PlayerScalarFieldEnum[]
  }

  /**
   * Player create
   */
  export type PlayerCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Player
     */
    select?: PlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Player
     */
    omit?: PlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerInclude<ExtArgs> | null
    /**
     * The data needed to create a Player.
     */
    data: XOR<PlayerCreateInput, PlayerUncheckedCreateInput>
  }

  /**
   * Player createMany
   */
  export type PlayerCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Players.
     */
    data: PlayerCreateManyInput | PlayerCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Player createManyAndReturn
   */
  export type PlayerCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Player
     */
    select?: PlayerSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Player
     */
    omit?: PlayerOmit<ExtArgs> | null
    /**
     * The data used to create many Players.
     */
    data: PlayerCreateManyInput | PlayerCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Player update
   */
  export type PlayerUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Player
     */
    select?: PlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Player
     */
    omit?: PlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerInclude<ExtArgs> | null
    /**
     * The data needed to update a Player.
     */
    data: XOR<PlayerUpdateInput, PlayerUncheckedUpdateInput>
    /**
     * Choose, which Player to update.
     */
    where: PlayerWhereUniqueInput
  }

  /**
   * Player updateMany
   */
  export type PlayerUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Players.
     */
    data: XOR<PlayerUpdateManyMutationInput, PlayerUncheckedUpdateManyInput>
    /**
     * Filter which Players to update
     */
    where?: PlayerWhereInput
    /**
     * Limit how many Players to update.
     */
    limit?: number
  }

  /**
   * Player updateManyAndReturn
   */
  export type PlayerUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Player
     */
    select?: PlayerSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Player
     */
    omit?: PlayerOmit<ExtArgs> | null
    /**
     * The data used to update Players.
     */
    data: XOR<PlayerUpdateManyMutationInput, PlayerUncheckedUpdateManyInput>
    /**
     * Filter which Players to update
     */
    where?: PlayerWhereInput
    /**
     * Limit how many Players to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Player upsert
   */
  export type PlayerUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Player
     */
    select?: PlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Player
     */
    omit?: PlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerInclude<ExtArgs> | null
    /**
     * The filter to search for the Player to update in case it exists.
     */
    where: PlayerWhereUniqueInput
    /**
     * In case the Player found by the `where` argument doesn't exist, create a new Player with this data.
     */
    create: XOR<PlayerCreateInput, PlayerUncheckedCreateInput>
    /**
     * In case the Player was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PlayerUpdateInput, PlayerUncheckedUpdateInput>
  }

  /**
   * Player delete
   */
  export type PlayerDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Player
     */
    select?: PlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Player
     */
    omit?: PlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerInclude<ExtArgs> | null
    /**
     * Filter which Player to delete.
     */
    where: PlayerWhereUniqueInput
  }

  /**
   * Player deleteMany
   */
  export type PlayerDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Players to delete
     */
    where?: PlayerWhereInput
    /**
     * Limit how many Players to delete.
     */
    limit?: number
  }

  /**
   * Player.gameScore
   */
  export type Player$gameScoreArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameScore
     */
    select?: GameScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameScore
     */
    omit?: GameScoreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameScoreInclude<ExtArgs> | null
    where?: GameScoreWhereInput
    orderBy?: GameScoreOrderByWithRelationInput | GameScoreOrderByWithRelationInput[]
    cursor?: GameScoreWhereUniqueInput
    take?: number
    skip?: number
    distinct?: GameScoreScalarFieldEnum | GameScoreScalarFieldEnum[]
  }

  /**
   * Player.pollVote
   */
  export type Player$pollVoteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PollVote
     */
    select?: PollVoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PollVote
     */
    omit?: PollVoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PollVoteInclude<ExtArgs> | null
    where?: PollVoteWhereInput
  }

  /**
   * Player.tournamentWinner
   */
  export type Player$tournamentWinnerArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TournamentWinner
     */
    select?: TournamentWinnerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TournamentWinner
     */
    omit?: TournamentWinnerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TournamentWinnerInclude<ExtArgs> | null
    where?: TournamentWinnerWhereInput
    orderBy?: TournamentWinnerOrderByWithRelationInput | TournamentWinnerOrderByWithRelationInput[]
    cursor?: TournamentWinnerWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TournamentWinnerScalarFieldEnum | TournamentWinnerScalarFieldEnum[]
  }

  /**
   * Player.Wallet
   */
  export type Player$WalletArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Wallet
     */
    omit?: WalletOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletInclude<ExtArgs> | null
    where?: WalletWhereInput
  }

  /**
   * Player.playerStats
   */
  export type Player$playerStatsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlayerStats
     */
    select?: PlayerStatsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PlayerStats
     */
    omit?: PlayerStatsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerStatsInclude<ExtArgs> | null
    where?: PlayerStatsWhereInput
  }

  /**
   * Player.team
   */
  export type Player$teamArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Team
     */
    select?: TeamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Team
     */
    omit?: TeamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamInclude<ExtArgs> | null
    where?: TeamWhereInput
  }

  /**
   * Player.characterImage
   */
  export type Player$characterImageArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Gallery
     */
    select?: GallerySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Gallery
     */
    omit?: GalleryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GalleryInclude<ExtArgs> | null
    where?: GalleryWhereInput
  }

  /**
   * Player without action
   */
  export type PlayerDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Player
     */
    select?: PlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Player
     */
    omit?: PlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerInclude<ExtArgs> | null
  }


  /**
   * Model GameScore
   */

  export type AggregateGameScore = {
    _count: GameScoreCountAggregateOutputType | null
    _avg: GameScoreAvgAggregateOutputType | null
    _sum: GameScoreSumAggregateOutputType | null
    _min: GameScoreMinAggregateOutputType | null
    _max: GameScoreMaxAggregateOutputType | null
  }

  export type GameScoreAvgAggregateOutputType = {
    highScore: number | null
  }

  export type GameScoreSumAggregateOutputType = {
    highScore: number | null
  }

  export type GameScoreMinAggregateOutputType = {
    highScore: number | null
    lastPlayedAt: Date | null
    playerId: string | null
  }

  export type GameScoreMaxAggregateOutputType = {
    highScore: number | null
    lastPlayedAt: Date | null
    playerId: string | null
  }

  export type GameScoreCountAggregateOutputType = {
    highScore: number
    lastPlayedAt: number
    playerId: number
    _all: number
  }


  export type GameScoreAvgAggregateInputType = {
    highScore?: true
  }

  export type GameScoreSumAggregateInputType = {
    highScore?: true
  }

  export type GameScoreMinAggregateInputType = {
    highScore?: true
    lastPlayedAt?: true
    playerId?: true
  }

  export type GameScoreMaxAggregateInputType = {
    highScore?: true
    lastPlayedAt?: true
    playerId?: true
  }

  export type GameScoreCountAggregateInputType = {
    highScore?: true
    lastPlayedAt?: true
    playerId?: true
    _all?: true
  }

  export type GameScoreAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which GameScore to aggregate.
     */
    where?: GameScoreWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GameScores to fetch.
     */
    orderBy?: GameScoreOrderByWithRelationInput | GameScoreOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: GameScoreWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GameScores from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GameScores.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned GameScores
    **/
    _count?: true | GameScoreCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: GameScoreAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: GameScoreSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: GameScoreMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: GameScoreMaxAggregateInputType
  }

  export type GetGameScoreAggregateType<T extends GameScoreAggregateArgs> = {
        [P in keyof T & keyof AggregateGameScore]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateGameScore[P]>
      : GetScalarType<T[P], AggregateGameScore[P]>
  }




  export type GameScoreGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: GameScoreWhereInput
    orderBy?: GameScoreOrderByWithAggregationInput | GameScoreOrderByWithAggregationInput[]
    by: GameScoreScalarFieldEnum[] | GameScoreScalarFieldEnum
    having?: GameScoreScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: GameScoreCountAggregateInputType | true
    _avg?: GameScoreAvgAggregateInputType
    _sum?: GameScoreSumAggregateInputType
    _min?: GameScoreMinAggregateInputType
    _max?: GameScoreMaxAggregateInputType
  }

  export type GameScoreGroupByOutputType = {
    highScore: number
    lastPlayedAt: Date
    playerId: string
    _count: GameScoreCountAggregateOutputType | null
    _avg: GameScoreAvgAggregateOutputType | null
    _sum: GameScoreSumAggregateOutputType | null
    _min: GameScoreMinAggregateOutputType | null
    _max: GameScoreMaxAggregateOutputType | null
  }

  type GetGameScoreGroupByPayload<T extends GameScoreGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<GameScoreGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof GameScoreGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], GameScoreGroupByOutputType[P]>
            : GetScalarType<T[P], GameScoreGroupByOutputType[P]>
        }
      >
    >


  export type GameScoreSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    highScore?: boolean
    lastPlayedAt?: boolean
    playerId?: boolean
    player?: boolean | PlayerDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["gameScore"]>

  export type GameScoreSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    highScore?: boolean
    lastPlayedAt?: boolean
    playerId?: boolean
    player?: boolean | PlayerDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["gameScore"]>

  export type GameScoreSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    highScore?: boolean
    lastPlayedAt?: boolean
    playerId?: boolean
    player?: boolean | PlayerDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["gameScore"]>

  export type GameScoreSelectScalar = {
    highScore?: boolean
    lastPlayedAt?: boolean
    playerId?: boolean
  }

  export type GameScoreOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"highScore" | "lastPlayedAt" | "playerId", ExtArgs["result"]["gameScore"]>
  export type GameScoreInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    player?: boolean | PlayerDefaultArgs<ExtArgs>
  }
  export type GameScoreIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    player?: boolean | PlayerDefaultArgs<ExtArgs>
  }
  export type GameScoreIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    player?: boolean | PlayerDefaultArgs<ExtArgs>
  }

  export type $GameScorePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "GameScore"
    objects: {
      player: Prisma.$PlayerPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      highScore: number
      lastPlayedAt: Date
      playerId: string
    }, ExtArgs["result"]["gameScore"]>
    composites: {}
  }

  type GameScoreGetPayload<S extends boolean | null | undefined | GameScoreDefaultArgs> = $Result.GetResult<Prisma.$GameScorePayload, S>

  type GameScoreCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<GameScoreFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: GameScoreCountAggregateInputType | true
    }

  export interface GameScoreDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['GameScore'], meta: { name: 'GameScore' } }
    /**
     * Find zero or one GameScore that matches the filter.
     * @param {GameScoreFindUniqueArgs} args - Arguments to find a GameScore
     * @example
     * // Get one GameScore
     * const gameScore = await prisma.gameScore.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends GameScoreFindUniqueArgs>(args: SelectSubset<T, GameScoreFindUniqueArgs<ExtArgs>>): Prisma__GameScoreClient<$Result.GetResult<Prisma.$GameScorePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one GameScore that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {GameScoreFindUniqueOrThrowArgs} args - Arguments to find a GameScore
     * @example
     * // Get one GameScore
     * const gameScore = await prisma.gameScore.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends GameScoreFindUniqueOrThrowArgs>(args: SelectSubset<T, GameScoreFindUniqueOrThrowArgs<ExtArgs>>): Prisma__GameScoreClient<$Result.GetResult<Prisma.$GameScorePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first GameScore that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameScoreFindFirstArgs} args - Arguments to find a GameScore
     * @example
     * // Get one GameScore
     * const gameScore = await prisma.gameScore.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends GameScoreFindFirstArgs>(args?: SelectSubset<T, GameScoreFindFirstArgs<ExtArgs>>): Prisma__GameScoreClient<$Result.GetResult<Prisma.$GameScorePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first GameScore that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameScoreFindFirstOrThrowArgs} args - Arguments to find a GameScore
     * @example
     * // Get one GameScore
     * const gameScore = await prisma.gameScore.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends GameScoreFindFirstOrThrowArgs>(args?: SelectSubset<T, GameScoreFindFirstOrThrowArgs<ExtArgs>>): Prisma__GameScoreClient<$Result.GetResult<Prisma.$GameScorePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more GameScores that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameScoreFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all GameScores
     * const gameScores = await prisma.gameScore.findMany()
     * 
     * // Get first 10 GameScores
     * const gameScores = await prisma.gameScore.findMany({ take: 10 })
     * 
     * // Only select the `highScore`
     * const gameScoreWithHighScoreOnly = await prisma.gameScore.findMany({ select: { highScore: true } })
     * 
     */
    findMany<T extends GameScoreFindManyArgs>(args?: SelectSubset<T, GameScoreFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GameScorePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a GameScore.
     * @param {GameScoreCreateArgs} args - Arguments to create a GameScore.
     * @example
     * // Create one GameScore
     * const GameScore = await prisma.gameScore.create({
     *   data: {
     *     // ... data to create a GameScore
     *   }
     * })
     * 
     */
    create<T extends GameScoreCreateArgs>(args: SelectSubset<T, GameScoreCreateArgs<ExtArgs>>): Prisma__GameScoreClient<$Result.GetResult<Prisma.$GameScorePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many GameScores.
     * @param {GameScoreCreateManyArgs} args - Arguments to create many GameScores.
     * @example
     * // Create many GameScores
     * const gameScore = await prisma.gameScore.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends GameScoreCreateManyArgs>(args?: SelectSubset<T, GameScoreCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many GameScores and returns the data saved in the database.
     * @param {GameScoreCreateManyAndReturnArgs} args - Arguments to create many GameScores.
     * @example
     * // Create many GameScores
     * const gameScore = await prisma.gameScore.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many GameScores and only return the `highScore`
     * const gameScoreWithHighScoreOnly = await prisma.gameScore.createManyAndReturn({
     *   select: { highScore: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends GameScoreCreateManyAndReturnArgs>(args?: SelectSubset<T, GameScoreCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GameScorePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a GameScore.
     * @param {GameScoreDeleteArgs} args - Arguments to delete one GameScore.
     * @example
     * // Delete one GameScore
     * const GameScore = await prisma.gameScore.delete({
     *   where: {
     *     // ... filter to delete one GameScore
     *   }
     * })
     * 
     */
    delete<T extends GameScoreDeleteArgs>(args: SelectSubset<T, GameScoreDeleteArgs<ExtArgs>>): Prisma__GameScoreClient<$Result.GetResult<Prisma.$GameScorePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one GameScore.
     * @param {GameScoreUpdateArgs} args - Arguments to update one GameScore.
     * @example
     * // Update one GameScore
     * const gameScore = await prisma.gameScore.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends GameScoreUpdateArgs>(args: SelectSubset<T, GameScoreUpdateArgs<ExtArgs>>): Prisma__GameScoreClient<$Result.GetResult<Prisma.$GameScorePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more GameScores.
     * @param {GameScoreDeleteManyArgs} args - Arguments to filter GameScores to delete.
     * @example
     * // Delete a few GameScores
     * const { count } = await prisma.gameScore.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends GameScoreDeleteManyArgs>(args?: SelectSubset<T, GameScoreDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more GameScores.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameScoreUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many GameScores
     * const gameScore = await prisma.gameScore.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends GameScoreUpdateManyArgs>(args: SelectSubset<T, GameScoreUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more GameScores and returns the data updated in the database.
     * @param {GameScoreUpdateManyAndReturnArgs} args - Arguments to update many GameScores.
     * @example
     * // Update many GameScores
     * const gameScore = await prisma.gameScore.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more GameScores and only return the `highScore`
     * const gameScoreWithHighScoreOnly = await prisma.gameScore.updateManyAndReturn({
     *   select: { highScore: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends GameScoreUpdateManyAndReturnArgs>(args: SelectSubset<T, GameScoreUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GameScorePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one GameScore.
     * @param {GameScoreUpsertArgs} args - Arguments to update or create a GameScore.
     * @example
     * // Update or create a GameScore
     * const gameScore = await prisma.gameScore.upsert({
     *   create: {
     *     // ... data to create a GameScore
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the GameScore we want to update
     *   }
     * })
     */
    upsert<T extends GameScoreUpsertArgs>(args: SelectSubset<T, GameScoreUpsertArgs<ExtArgs>>): Prisma__GameScoreClient<$Result.GetResult<Prisma.$GameScorePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of GameScores.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameScoreCountArgs} args - Arguments to filter GameScores to count.
     * @example
     * // Count the number of GameScores
     * const count = await prisma.gameScore.count({
     *   where: {
     *     // ... the filter for the GameScores we want to count
     *   }
     * })
    **/
    count<T extends GameScoreCountArgs>(
      args?: Subset<T, GameScoreCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], GameScoreCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a GameScore.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameScoreAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends GameScoreAggregateArgs>(args: Subset<T, GameScoreAggregateArgs>): Prisma.PrismaPromise<GetGameScoreAggregateType<T>>

    /**
     * Group by GameScore.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameScoreGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends GameScoreGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: GameScoreGroupByArgs['orderBy'] }
        : { orderBy?: GameScoreGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, GameScoreGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetGameScoreGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the GameScore model
   */
  readonly fields: GameScoreFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for GameScore.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__GameScoreClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    player<T extends PlayerDefaultArgs<ExtArgs> = {}>(args?: Subset<T, PlayerDefaultArgs<ExtArgs>>): Prisma__PlayerClient<$Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the GameScore model
   */
  interface GameScoreFieldRefs {
    readonly highScore: FieldRef<"GameScore", 'Int'>
    readonly lastPlayedAt: FieldRef<"GameScore", 'DateTime'>
    readonly playerId: FieldRef<"GameScore", 'String'>
  }
    

  // Custom InputTypes
  /**
   * GameScore findUnique
   */
  export type GameScoreFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameScore
     */
    select?: GameScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameScore
     */
    omit?: GameScoreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameScoreInclude<ExtArgs> | null
    /**
     * Filter, which GameScore to fetch.
     */
    where: GameScoreWhereUniqueInput
  }

  /**
   * GameScore findUniqueOrThrow
   */
  export type GameScoreFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameScore
     */
    select?: GameScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameScore
     */
    omit?: GameScoreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameScoreInclude<ExtArgs> | null
    /**
     * Filter, which GameScore to fetch.
     */
    where: GameScoreWhereUniqueInput
  }

  /**
   * GameScore findFirst
   */
  export type GameScoreFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameScore
     */
    select?: GameScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameScore
     */
    omit?: GameScoreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameScoreInclude<ExtArgs> | null
    /**
     * Filter, which GameScore to fetch.
     */
    where?: GameScoreWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GameScores to fetch.
     */
    orderBy?: GameScoreOrderByWithRelationInput | GameScoreOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for GameScores.
     */
    cursor?: GameScoreWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GameScores from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GameScores.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of GameScores.
     */
    distinct?: GameScoreScalarFieldEnum | GameScoreScalarFieldEnum[]
  }

  /**
   * GameScore findFirstOrThrow
   */
  export type GameScoreFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameScore
     */
    select?: GameScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameScore
     */
    omit?: GameScoreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameScoreInclude<ExtArgs> | null
    /**
     * Filter, which GameScore to fetch.
     */
    where?: GameScoreWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GameScores to fetch.
     */
    orderBy?: GameScoreOrderByWithRelationInput | GameScoreOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for GameScores.
     */
    cursor?: GameScoreWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GameScores from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GameScores.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of GameScores.
     */
    distinct?: GameScoreScalarFieldEnum | GameScoreScalarFieldEnum[]
  }

  /**
   * GameScore findMany
   */
  export type GameScoreFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameScore
     */
    select?: GameScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameScore
     */
    omit?: GameScoreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameScoreInclude<ExtArgs> | null
    /**
     * Filter, which GameScores to fetch.
     */
    where?: GameScoreWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GameScores to fetch.
     */
    orderBy?: GameScoreOrderByWithRelationInput | GameScoreOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing GameScores.
     */
    cursor?: GameScoreWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GameScores from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GameScores.
     */
    skip?: number
    distinct?: GameScoreScalarFieldEnum | GameScoreScalarFieldEnum[]
  }

  /**
   * GameScore create
   */
  export type GameScoreCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameScore
     */
    select?: GameScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameScore
     */
    omit?: GameScoreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameScoreInclude<ExtArgs> | null
    /**
     * The data needed to create a GameScore.
     */
    data: XOR<GameScoreCreateInput, GameScoreUncheckedCreateInput>
  }

  /**
   * GameScore createMany
   */
  export type GameScoreCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many GameScores.
     */
    data: GameScoreCreateManyInput | GameScoreCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * GameScore createManyAndReturn
   */
  export type GameScoreCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameScore
     */
    select?: GameScoreSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the GameScore
     */
    omit?: GameScoreOmit<ExtArgs> | null
    /**
     * The data used to create many GameScores.
     */
    data: GameScoreCreateManyInput | GameScoreCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameScoreIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * GameScore update
   */
  export type GameScoreUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameScore
     */
    select?: GameScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameScore
     */
    omit?: GameScoreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameScoreInclude<ExtArgs> | null
    /**
     * The data needed to update a GameScore.
     */
    data: XOR<GameScoreUpdateInput, GameScoreUncheckedUpdateInput>
    /**
     * Choose, which GameScore to update.
     */
    where: GameScoreWhereUniqueInput
  }

  /**
   * GameScore updateMany
   */
  export type GameScoreUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update GameScores.
     */
    data: XOR<GameScoreUpdateManyMutationInput, GameScoreUncheckedUpdateManyInput>
    /**
     * Filter which GameScores to update
     */
    where?: GameScoreWhereInput
    /**
     * Limit how many GameScores to update.
     */
    limit?: number
  }

  /**
   * GameScore updateManyAndReturn
   */
  export type GameScoreUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameScore
     */
    select?: GameScoreSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the GameScore
     */
    omit?: GameScoreOmit<ExtArgs> | null
    /**
     * The data used to update GameScores.
     */
    data: XOR<GameScoreUpdateManyMutationInput, GameScoreUncheckedUpdateManyInput>
    /**
     * Filter which GameScores to update
     */
    where?: GameScoreWhereInput
    /**
     * Limit how many GameScores to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameScoreIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * GameScore upsert
   */
  export type GameScoreUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameScore
     */
    select?: GameScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameScore
     */
    omit?: GameScoreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameScoreInclude<ExtArgs> | null
    /**
     * The filter to search for the GameScore to update in case it exists.
     */
    where: GameScoreWhereUniqueInput
    /**
     * In case the GameScore found by the `where` argument doesn't exist, create a new GameScore with this data.
     */
    create: XOR<GameScoreCreateInput, GameScoreUncheckedCreateInput>
    /**
     * In case the GameScore was found with the provided `where` argument, update it with this data.
     */
    update: XOR<GameScoreUpdateInput, GameScoreUncheckedUpdateInput>
  }

  /**
   * GameScore delete
   */
  export type GameScoreDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameScore
     */
    select?: GameScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameScore
     */
    omit?: GameScoreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameScoreInclude<ExtArgs> | null
    /**
     * Filter which GameScore to delete.
     */
    where: GameScoreWhereUniqueInput
  }

  /**
   * GameScore deleteMany
   */
  export type GameScoreDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which GameScores to delete
     */
    where?: GameScoreWhereInput
    /**
     * Limit how many GameScores to delete.
     */
    limit?: number
  }

  /**
   * GameScore without action
   */
  export type GameScoreDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameScore
     */
    select?: GameScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameScore
     */
    omit?: GameScoreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameScoreInclude<ExtArgs> | null
  }


  /**
   * Model Gallery
   */

  export type AggregateGallery = {
    _count: GalleryCountAggregateOutputType | null
    _min: GalleryMinAggregateOutputType | null
    _max: GalleryMaxAggregateOutputType | null
  }

  export type GalleryMinAggregateOutputType = {
    id: string | null
    imageId: string | null
    name: string | null
    path: string | null
    fullPath: string | null
    publicUrl: string | null
    isCharacterImg: boolean | null
    playerId: string | null
  }

  export type GalleryMaxAggregateOutputType = {
    id: string | null
    imageId: string | null
    name: string | null
    path: string | null
    fullPath: string | null
    publicUrl: string | null
    isCharacterImg: boolean | null
    playerId: string | null
  }

  export type GalleryCountAggregateOutputType = {
    id: number
    imageId: number
    name: number
    path: number
    fullPath: number
    publicUrl: number
    isCharacterImg: number
    playerId: number
    _all: number
  }


  export type GalleryMinAggregateInputType = {
    id?: true
    imageId?: true
    name?: true
    path?: true
    fullPath?: true
    publicUrl?: true
    isCharacterImg?: true
    playerId?: true
  }

  export type GalleryMaxAggregateInputType = {
    id?: true
    imageId?: true
    name?: true
    path?: true
    fullPath?: true
    publicUrl?: true
    isCharacterImg?: true
    playerId?: true
  }

  export type GalleryCountAggregateInputType = {
    id?: true
    imageId?: true
    name?: true
    path?: true
    fullPath?: true
    publicUrl?: true
    isCharacterImg?: true
    playerId?: true
    _all?: true
  }

  export type GalleryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Gallery to aggregate.
     */
    where?: GalleryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Galleries to fetch.
     */
    orderBy?: GalleryOrderByWithRelationInput | GalleryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: GalleryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Galleries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Galleries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Galleries
    **/
    _count?: true | GalleryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: GalleryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: GalleryMaxAggregateInputType
  }

  export type GetGalleryAggregateType<T extends GalleryAggregateArgs> = {
        [P in keyof T & keyof AggregateGallery]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateGallery[P]>
      : GetScalarType<T[P], AggregateGallery[P]>
  }




  export type GalleryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: GalleryWhereInput
    orderBy?: GalleryOrderByWithAggregationInput | GalleryOrderByWithAggregationInput[]
    by: GalleryScalarFieldEnum[] | GalleryScalarFieldEnum
    having?: GalleryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: GalleryCountAggregateInputType | true
    _min?: GalleryMinAggregateInputType
    _max?: GalleryMaxAggregateInputType
  }

  export type GalleryGroupByOutputType = {
    id: string
    imageId: string
    name: string
    path: string
    fullPath: string
    publicUrl: string
    isCharacterImg: boolean
    playerId: string | null
    _count: GalleryCountAggregateOutputType | null
    _min: GalleryMinAggregateOutputType | null
    _max: GalleryMaxAggregateOutputType | null
  }

  type GetGalleryGroupByPayload<T extends GalleryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<GalleryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof GalleryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], GalleryGroupByOutputType[P]>
            : GetScalarType<T[P], GalleryGroupByOutputType[P]>
        }
      >
    >


  export type GallerySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    imageId?: boolean
    name?: boolean
    path?: boolean
    fullPath?: boolean
    publicUrl?: boolean
    isCharacterImg?: boolean
    playerId?: boolean
    player?: boolean | Gallery$playerArgs<ExtArgs>
    tournament?: boolean | Gallery$tournamentArgs<ExtArgs>
    _count?: boolean | GalleryCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["gallery"]>

  export type GallerySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    imageId?: boolean
    name?: boolean
    path?: boolean
    fullPath?: boolean
    publicUrl?: boolean
    isCharacterImg?: boolean
    playerId?: boolean
  }, ExtArgs["result"]["gallery"]>

  export type GallerySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    imageId?: boolean
    name?: boolean
    path?: boolean
    fullPath?: boolean
    publicUrl?: boolean
    isCharacterImg?: boolean
    playerId?: boolean
  }, ExtArgs["result"]["gallery"]>

  export type GallerySelectScalar = {
    id?: boolean
    imageId?: boolean
    name?: boolean
    path?: boolean
    fullPath?: boolean
    publicUrl?: boolean
    isCharacterImg?: boolean
    playerId?: boolean
  }

  export type GalleryOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "imageId" | "name" | "path" | "fullPath" | "publicUrl" | "isCharacterImg" | "playerId", ExtArgs["result"]["gallery"]>
  export type GalleryInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    player?: boolean | Gallery$playerArgs<ExtArgs>
    tournament?: boolean | Gallery$tournamentArgs<ExtArgs>
    _count?: boolean | GalleryCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type GalleryIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type GalleryIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $GalleryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Gallery"
    objects: {
      player: Prisma.$PlayerPayload<ExtArgs> | null
      tournament: Prisma.$TournamentPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      imageId: string
      name: string
      path: string
      fullPath: string
      publicUrl: string
      isCharacterImg: boolean
      playerId: string | null
    }, ExtArgs["result"]["gallery"]>
    composites: {}
  }

  type GalleryGetPayload<S extends boolean | null | undefined | GalleryDefaultArgs> = $Result.GetResult<Prisma.$GalleryPayload, S>

  type GalleryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<GalleryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: GalleryCountAggregateInputType | true
    }

  export interface GalleryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Gallery'], meta: { name: 'Gallery' } }
    /**
     * Find zero or one Gallery that matches the filter.
     * @param {GalleryFindUniqueArgs} args - Arguments to find a Gallery
     * @example
     * // Get one Gallery
     * const gallery = await prisma.gallery.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends GalleryFindUniqueArgs>(args: SelectSubset<T, GalleryFindUniqueArgs<ExtArgs>>): Prisma__GalleryClient<$Result.GetResult<Prisma.$GalleryPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Gallery that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {GalleryFindUniqueOrThrowArgs} args - Arguments to find a Gallery
     * @example
     * // Get one Gallery
     * const gallery = await prisma.gallery.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends GalleryFindUniqueOrThrowArgs>(args: SelectSubset<T, GalleryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__GalleryClient<$Result.GetResult<Prisma.$GalleryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Gallery that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GalleryFindFirstArgs} args - Arguments to find a Gallery
     * @example
     * // Get one Gallery
     * const gallery = await prisma.gallery.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends GalleryFindFirstArgs>(args?: SelectSubset<T, GalleryFindFirstArgs<ExtArgs>>): Prisma__GalleryClient<$Result.GetResult<Prisma.$GalleryPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Gallery that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GalleryFindFirstOrThrowArgs} args - Arguments to find a Gallery
     * @example
     * // Get one Gallery
     * const gallery = await prisma.gallery.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends GalleryFindFirstOrThrowArgs>(args?: SelectSubset<T, GalleryFindFirstOrThrowArgs<ExtArgs>>): Prisma__GalleryClient<$Result.GetResult<Prisma.$GalleryPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Galleries that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GalleryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Galleries
     * const galleries = await prisma.gallery.findMany()
     * 
     * // Get first 10 Galleries
     * const galleries = await prisma.gallery.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const galleryWithIdOnly = await prisma.gallery.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends GalleryFindManyArgs>(args?: SelectSubset<T, GalleryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GalleryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Gallery.
     * @param {GalleryCreateArgs} args - Arguments to create a Gallery.
     * @example
     * // Create one Gallery
     * const Gallery = await prisma.gallery.create({
     *   data: {
     *     // ... data to create a Gallery
     *   }
     * })
     * 
     */
    create<T extends GalleryCreateArgs>(args: SelectSubset<T, GalleryCreateArgs<ExtArgs>>): Prisma__GalleryClient<$Result.GetResult<Prisma.$GalleryPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Galleries.
     * @param {GalleryCreateManyArgs} args - Arguments to create many Galleries.
     * @example
     * // Create many Galleries
     * const gallery = await prisma.gallery.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends GalleryCreateManyArgs>(args?: SelectSubset<T, GalleryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Galleries and returns the data saved in the database.
     * @param {GalleryCreateManyAndReturnArgs} args - Arguments to create many Galleries.
     * @example
     * // Create many Galleries
     * const gallery = await prisma.gallery.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Galleries and only return the `id`
     * const galleryWithIdOnly = await prisma.gallery.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends GalleryCreateManyAndReturnArgs>(args?: SelectSubset<T, GalleryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GalleryPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Gallery.
     * @param {GalleryDeleteArgs} args - Arguments to delete one Gallery.
     * @example
     * // Delete one Gallery
     * const Gallery = await prisma.gallery.delete({
     *   where: {
     *     // ... filter to delete one Gallery
     *   }
     * })
     * 
     */
    delete<T extends GalleryDeleteArgs>(args: SelectSubset<T, GalleryDeleteArgs<ExtArgs>>): Prisma__GalleryClient<$Result.GetResult<Prisma.$GalleryPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Gallery.
     * @param {GalleryUpdateArgs} args - Arguments to update one Gallery.
     * @example
     * // Update one Gallery
     * const gallery = await prisma.gallery.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends GalleryUpdateArgs>(args: SelectSubset<T, GalleryUpdateArgs<ExtArgs>>): Prisma__GalleryClient<$Result.GetResult<Prisma.$GalleryPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Galleries.
     * @param {GalleryDeleteManyArgs} args - Arguments to filter Galleries to delete.
     * @example
     * // Delete a few Galleries
     * const { count } = await prisma.gallery.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends GalleryDeleteManyArgs>(args?: SelectSubset<T, GalleryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Galleries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GalleryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Galleries
     * const gallery = await prisma.gallery.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends GalleryUpdateManyArgs>(args: SelectSubset<T, GalleryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Galleries and returns the data updated in the database.
     * @param {GalleryUpdateManyAndReturnArgs} args - Arguments to update many Galleries.
     * @example
     * // Update many Galleries
     * const gallery = await prisma.gallery.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Galleries and only return the `id`
     * const galleryWithIdOnly = await prisma.gallery.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends GalleryUpdateManyAndReturnArgs>(args: SelectSubset<T, GalleryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GalleryPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Gallery.
     * @param {GalleryUpsertArgs} args - Arguments to update or create a Gallery.
     * @example
     * // Update or create a Gallery
     * const gallery = await prisma.gallery.upsert({
     *   create: {
     *     // ... data to create a Gallery
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Gallery we want to update
     *   }
     * })
     */
    upsert<T extends GalleryUpsertArgs>(args: SelectSubset<T, GalleryUpsertArgs<ExtArgs>>): Prisma__GalleryClient<$Result.GetResult<Prisma.$GalleryPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Galleries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GalleryCountArgs} args - Arguments to filter Galleries to count.
     * @example
     * // Count the number of Galleries
     * const count = await prisma.gallery.count({
     *   where: {
     *     // ... the filter for the Galleries we want to count
     *   }
     * })
    **/
    count<T extends GalleryCountArgs>(
      args?: Subset<T, GalleryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], GalleryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Gallery.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GalleryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends GalleryAggregateArgs>(args: Subset<T, GalleryAggregateArgs>): Prisma.PrismaPromise<GetGalleryAggregateType<T>>

    /**
     * Group by Gallery.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GalleryGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends GalleryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: GalleryGroupByArgs['orderBy'] }
        : { orderBy?: GalleryGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, GalleryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetGalleryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Gallery model
   */
  readonly fields: GalleryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Gallery.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__GalleryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    player<T extends Gallery$playerArgs<ExtArgs> = {}>(args?: Subset<T, Gallery$playerArgs<ExtArgs>>): Prisma__PlayerClient<$Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    tournament<T extends Gallery$tournamentArgs<ExtArgs> = {}>(args?: Subset<T, Gallery$tournamentArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TournamentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Gallery model
   */
  interface GalleryFieldRefs {
    readonly id: FieldRef<"Gallery", 'String'>
    readonly imageId: FieldRef<"Gallery", 'String'>
    readonly name: FieldRef<"Gallery", 'String'>
    readonly path: FieldRef<"Gallery", 'String'>
    readonly fullPath: FieldRef<"Gallery", 'String'>
    readonly publicUrl: FieldRef<"Gallery", 'String'>
    readonly isCharacterImg: FieldRef<"Gallery", 'Boolean'>
    readonly playerId: FieldRef<"Gallery", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Gallery findUnique
   */
  export type GalleryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Gallery
     */
    select?: GallerySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Gallery
     */
    omit?: GalleryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GalleryInclude<ExtArgs> | null
    /**
     * Filter, which Gallery to fetch.
     */
    where: GalleryWhereUniqueInput
  }

  /**
   * Gallery findUniqueOrThrow
   */
  export type GalleryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Gallery
     */
    select?: GallerySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Gallery
     */
    omit?: GalleryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GalleryInclude<ExtArgs> | null
    /**
     * Filter, which Gallery to fetch.
     */
    where: GalleryWhereUniqueInput
  }

  /**
   * Gallery findFirst
   */
  export type GalleryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Gallery
     */
    select?: GallerySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Gallery
     */
    omit?: GalleryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GalleryInclude<ExtArgs> | null
    /**
     * Filter, which Gallery to fetch.
     */
    where?: GalleryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Galleries to fetch.
     */
    orderBy?: GalleryOrderByWithRelationInput | GalleryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Galleries.
     */
    cursor?: GalleryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Galleries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Galleries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Galleries.
     */
    distinct?: GalleryScalarFieldEnum | GalleryScalarFieldEnum[]
  }

  /**
   * Gallery findFirstOrThrow
   */
  export type GalleryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Gallery
     */
    select?: GallerySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Gallery
     */
    omit?: GalleryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GalleryInclude<ExtArgs> | null
    /**
     * Filter, which Gallery to fetch.
     */
    where?: GalleryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Galleries to fetch.
     */
    orderBy?: GalleryOrderByWithRelationInput | GalleryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Galleries.
     */
    cursor?: GalleryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Galleries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Galleries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Galleries.
     */
    distinct?: GalleryScalarFieldEnum | GalleryScalarFieldEnum[]
  }

  /**
   * Gallery findMany
   */
  export type GalleryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Gallery
     */
    select?: GallerySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Gallery
     */
    omit?: GalleryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GalleryInclude<ExtArgs> | null
    /**
     * Filter, which Galleries to fetch.
     */
    where?: GalleryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Galleries to fetch.
     */
    orderBy?: GalleryOrderByWithRelationInput | GalleryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Galleries.
     */
    cursor?: GalleryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Galleries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Galleries.
     */
    skip?: number
    distinct?: GalleryScalarFieldEnum | GalleryScalarFieldEnum[]
  }

  /**
   * Gallery create
   */
  export type GalleryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Gallery
     */
    select?: GallerySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Gallery
     */
    omit?: GalleryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GalleryInclude<ExtArgs> | null
    /**
     * The data needed to create a Gallery.
     */
    data: XOR<GalleryCreateInput, GalleryUncheckedCreateInput>
  }

  /**
   * Gallery createMany
   */
  export type GalleryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Galleries.
     */
    data: GalleryCreateManyInput | GalleryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Gallery createManyAndReturn
   */
  export type GalleryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Gallery
     */
    select?: GallerySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Gallery
     */
    omit?: GalleryOmit<ExtArgs> | null
    /**
     * The data used to create many Galleries.
     */
    data: GalleryCreateManyInput | GalleryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Gallery update
   */
  export type GalleryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Gallery
     */
    select?: GallerySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Gallery
     */
    omit?: GalleryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GalleryInclude<ExtArgs> | null
    /**
     * The data needed to update a Gallery.
     */
    data: XOR<GalleryUpdateInput, GalleryUncheckedUpdateInput>
    /**
     * Choose, which Gallery to update.
     */
    where: GalleryWhereUniqueInput
  }

  /**
   * Gallery updateMany
   */
  export type GalleryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Galleries.
     */
    data: XOR<GalleryUpdateManyMutationInput, GalleryUncheckedUpdateManyInput>
    /**
     * Filter which Galleries to update
     */
    where?: GalleryWhereInput
    /**
     * Limit how many Galleries to update.
     */
    limit?: number
  }

  /**
   * Gallery updateManyAndReturn
   */
  export type GalleryUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Gallery
     */
    select?: GallerySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Gallery
     */
    omit?: GalleryOmit<ExtArgs> | null
    /**
     * The data used to update Galleries.
     */
    data: XOR<GalleryUpdateManyMutationInput, GalleryUncheckedUpdateManyInput>
    /**
     * Filter which Galleries to update
     */
    where?: GalleryWhereInput
    /**
     * Limit how many Galleries to update.
     */
    limit?: number
  }

  /**
   * Gallery upsert
   */
  export type GalleryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Gallery
     */
    select?: GallerySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Gallery
     */
    omit?: GalleryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GalleryInclude<ExtArgs> | null
    /**
     * The filter to search for the Gallery to update in case it exists.
     */
    where: GalleryWhereUniqueInput
    /**
     * In case the Gallery found by the `where` argument doesn't exist, create a new Gallery with this data.
     */
    create: XOR<GalleryCreateInput, GalleryUncheckedCreateInput>
    /**
     * In case the Gallery was found with the provided `where` argument, update it with this data.
     */
    update: XOR<GalleryUpdateInput, GalleryUncheckedUpdateInput>
  }

  /**
   * Gallery delete
   */
  export type GalleryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Gallery
     */
    select?: GallerySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Gallery
     */
    omit?: GalleryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GalleryInclude<ExtArgs> | null
    /**
     * Filter which Gallery to delete.
     */
    where: GalleryWhereUniqueInput
  }

  /**
   * Gallery deleteMany
   */
  export type GalleryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Galleries to delete
     */
    where?: GalleryWhereInput
    /**
     * Limit how many Galleries to delete.
     */
    limit?: number
  }

  /**
   * Gallery.player
   */
  export type Gallery$playerArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Player
     */
    select?: PlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Player
     */
    omit?: PlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerInclude<ExtArgs> | null
    where?: PlayerWhereInput
  }

  /**
   * Gallery.tournament
   */
  export type Gallery$tournamentArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tournament
     */
    select?: TournamentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tournament
     */
    omit?: TournamentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TournamentInclude<ExtArgs> | null
    where?: TournamentWhereInput
    orderBy?: TournamentOrderByWithRelationInput | TournamentOrderByWithRelationInput[]
    cursor?: TournamentWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TournamentScalarFieldEnum | TournamentScalarFieldEnum[]
  }

  /**
   * Gallery without action
   */
  export type GalleryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Gallery
     */
    select?: GallerySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Gallery
     */
    omit?: GalleryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GalleryInclude<ExtArgs> | null
  }


  /**
   * Model Season
   */

  export type AggregateSeason = {
    _count: SeasonCountAggregateOutputType | null
    _min: SeasonMinAggregateOutputType | null
    _max: SeasonMaxAggregateOutputType | null
  }

  export type SeasonMinAggregateOutputType = {
    id: string | null
    name: string | null
    description: string | null
    startDate: Date | null
    endDate: Date | null
    status: $Enums.SeasonStatus | null
    createdBy: string | null
    createdAt: Date | null
  }

  export type SeasonMaxAggregateOutputType = {
    id: string | null
    name: string | null
    description: string | null
    startDate: Date | null
    endDate: Date | null
    status: $Enums.SeasonStatus | null
    createdBy: string | null
    createdAt: Date | null
  }

  export type SeasonCountAggregateOutputType = {
    id: number
    name: number
    description: number
    startDate: number
    endDate: number
    status: number
    createdBy: number
    createdAt: number
    _all: number
  }


  export type SeasonMinAggregateInputType = {
    id?: true
    name?: true
    description?: true
    startDate?: true
    endDate?: true
    status?: true
    createdBy?: true
    createdAt?: true
  }

  export type SeasonMaxAggregateInputType = {
    id?: true
    name?: true
    description?: true
    startDate?: true
    endDate?: true
    status?: true
    createdBy?: true
    createdAt?: true
  }

  export type SeasonCountAggregateInputType = {
    id?: true
    name?: true
    description?: true
    startDate?: true
    endDate?: true
    status?: true
    createdBy?: true
    createdAt?: true
    _all?: true
  }

  export type SeasonAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Season to aggregate.
     */
    where?: SeasonWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Seasons to fetch.
     */
    orderBy?: SeasonOrderByWithRelationInput | SeasonOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SeasonWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Seasons from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Seasons.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Seasons
    **/
    _count?: true | SeasonCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SeasonMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SeasonMaxAggregateInputType
  }

  export type GetSeasonAggregateType<T extends SeasonAggregateArgs> = {
        [P in keyof T & keyof AggregateSeason]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSeason[P]>
      : GetScalarType<T[P], AggregateSeason[P]>
  }




  export type SeasonGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SeasonWhereInput
    orderBy?: SeasonOrderByWithAggregationInput | SeasonOrderByWithAggregationInput[]
    by: SeasonScalarFieldEnum[] | SeasonScalarFieldEnum
    having?: SeasonScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SeasonCountAggregateInputType | true
    _min?: SeasonMinAggregateInputType
    _max?: SeasonMaxAggregateInputType
  }

  export type SeasonGroupByOutputType = {
    id: string
    name: string
    description: string | null
    startDate: Date
    endDate: Date
    status: $Enums.SeasonStatus
    createdBy: string
    createdAt: Date
    _count: SeasonCountAggregateOutputType | null
    _min: SeasonMinAggregateOutputType | null
    _max: SeasonMaxAggregateOutputType | null
  }

  type GetSeasonGroupByPayload<T extends SeasonGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SeasonGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SeasonGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SeasonGroupByOutputType[P]>
            : GetScalarType<T[P], SeasonGroupByOutputType[P]>
        }
      >
    >


  export type SeasonSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    description?: boolean
    startDate?: boolean
    endDate?: boolean
    status?: boolean
    createdBy?: boolean
    createdAt?: boolean
    tournament?: boolean | Season$tournamentArgs<ExtArgs>
    _count?: boolean | SeasonCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["season"]>

  export type SeasonSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    description?: boolean
    startDate?: boolean
    endDate?: boolean
    status?: boolean
    createdBy?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["season"]>

  export type SeasonSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    description?: boolean
    startDate?: boolean
    endDate?: boolean
    status?: boolean
    createdBy?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["season"]>

  export type SeasonSelectScalar = {
    id?: boolean
    name?: boolean
    description?: boolean
    startDate?: boolean
    endDate?: boolean
    status?: boolean
    createdBy?: boolean
    createdAt?: boolean
  }

  export type SeasonOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "description" | "startDate" | "endDate" | "status" | "createdBy" | "createdAt", ExtArgs["result"]["season"]>
  export type SeasonInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tournament?: boolean | Season$tournamentArgs<ExtArgs>
    _count?: boolean | SeasonCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type SeasonIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type SeasonIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $SeasonPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Season"
    objects: {
      tournament: Prisma.$TournamentPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      description: string | null
      startDate: Date
      endDate: Date
      status: $Enums.SeasonStatus
      createdBy: string
      createdAt: Date
    }, ExtArgs["result"]["season"]>
    composites: {}
  }

  type SeasonGetPayload<S extends boolean | null | undefined | SeasonDefaultArgs> = $Result.GetResult<Prisma.$SeasonPayload, S>

  type SeasonCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SeasonFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SeasonCountAggregateInputType | true
    }

  export interface SeasonDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Season'], meta: { name: 'Season' } }
    /**
     * Find zero or one Season that matches the filter.
     * @param {SeasonFindUniqueArgs} args - Arguments to find a Season
     * @example
     * // Get one Season
     * const season = await prisma.season.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SeasonFindUniqueArgs>(args: SelectSubset<T, SeasonFindUniqueArgs<ExtArgs>>): Prisma__SeasonClient<$Result.GetResult<Prisma.$SeasonPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Season that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SeasonFindUniqueOrThrowArgs} args - Arguments to find a Season
     * @example
     * // Get one Season
     * const season = await prisma.season.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SeasonFindUniqueOrThrowArgs>(args: SelectSubset<T, SeasonFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SeasonClient<$Result.GetResult<Prisma.$SeasonPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Season that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SeasonFindFirstArgs} args - Arguments to find a Season
     * @example
     * // Get one Season
     * const season = await prisma.season.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SeasonFindFirstArgs>(args?: SelectSubset<T, SeasonFindFirstArgs<ExtArgs>>): Prisma__SeasonClient<$Result.GetResult<Prisma.$SeasonPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Season that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SeasonFindFirstOrThrowArgs} args - Arguments to find a Season
     * @example
     * // Get one Season
     * const season = await prisma.season.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SeasonFindFirstOrThrowArgs>(args?: SelectSubset<T, SeasonFindFirstOrThrowArgs<ExtArgs>>): Prisma__SeasonClient<$Result.GetResult<Prisma.$SeasonPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Seasons that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SeasonFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Seasons
     * const seasons = await prisma.season.findMany()
     * 
     * // Get first 10 Seasons
     * const seasons = await prisma.season.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const seasonWithIdOnly = await prisma.season.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SeasonFindManyArgs>(args?: SelectSubset<T, SeasonFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SeasonPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Season.
     * @param {SeasonCreateArgs} args - Arguments to create a Season.
     * @example
     * // Create one Season
     * const Season = await prisma.season.create({
     *   data: {
     *     // ... data to create a Season
     *   }
     * })
     * 
     */
    create<T extends SeasonCreateArgs>(args: SelectSubset<T, SeasonCreateArgs<ExtArgs>>): Prisma__SeasonClient<$Result.GetResult<Prisma.$SeasonPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Seasons.
     * @param {SeasonCreateManyArgs} args - Arguments to create many Seasons.
     * @example
     * // Create many Seasons
     * const season = await prisma.season.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SeasonCreateManyArgs>(args?: SelectSubset<T, SeasonCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Seasons and returns the data saved in the database.
     * @param {SeasonCreateManyAndReturnArgs} args - Arguments to create many Seasons.
     * @example
     * // Create many Seasons
     * const season = await prisma.season.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Seasons and only return the `id`
     * const seasonWithIdOnly = await prisma.season.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SeasonCreateManyAndReturnArgs>(args?: SelectSubset<T, SeasonCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SeasonPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Season.
     * @param {SeasonDeleteArgs} args - Arguments to delete one Season.
     * @example
     * // Delete one Season
     * const Season = await prisma.season.delete({
     *   where: {
     *     // ... filter to delete one Season
     *   }
     * })
     * 
     */
    delete<T extends SeasonDeleteArgs>(args: SelectSubset<T, SeasonDeleteArgs<ExtArgs>>): Prisma__SeasonClient<$Result.GetResult<Prisma.$SeasonPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Season.
     * @param {SeasonUpdateArgs} args - Arguments to update one Season.
     * @example
     * // Update one Season
     * const season = await prisma.season.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SeasonUpdateArgs>(args: SelectSubset<T, SeasonUpdateArgs<ExtArgs>>): Prisma__SeasonClient<$Result.GetResult<Prisma.$SeasonPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Seasons.
     * @param {SeasonDeleteManyArgs} args - Arguments to filter Seasons to delete.
     * @example
     * // Delete a few Seasons
     * const { count } = await prisma.season.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SeasonDeleteManyArgs>(args?: SelectSubset<T, SeasonDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Seasons.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SeasonUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Seasons
     * const season = await prisma.season.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SeasonUpdateManyArgs>(args: SelectSubset<T, SeasonUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Seasons and returns the data updated in the database.
     * @param {SeasonUpdateManyAndReturnArgs} args - Arguments to update many Seasons.
     * @example
     * // Update many Seasons
     * const season = await prisma.season.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Seasons and only return the `id`
     * const seasonWithIdOnly = await prisma.season.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SeasonUpdateManyAndReturnArgs>(args: SelectSubset<T, SeasonUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SeasonPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Season.
     * @param {SeasonUpsertArgs} args - Arguments to update or create a Season.
     * @example
     * // Update or create a Season
     * const season = await prisma.season.upsert({
     *   create: {
     *     // ... data to create a Season
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Season we want to update
     *   }
     * })
     */
    upsert<T extends SeasonUpsertArgs>(args: SelectSubset<T, SeasonUpsertArgs<ExtArgs>>): Prisma__SeasonClient<$Result.GetResult<Prisma.$SeasonPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Seasons.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SeasonCountArgs} args - Arguments to filter Seasons to count.
     * @example
     * // Count the number of Seasons
     * const count = await prisma.season.count({
     *   where: {
     *     // ... the filter for the Seasons we want to count
     *   }
     * })
    **/
    count<T extends SeasonCountArgs>(
      args?: Subset<T, SeasonCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SeasonCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Season.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SeasonAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SeasonAggregateArgs>(args: Subset<T, SeasonAggregateArgs>): Prisma.PrismaPromise<GetSeasonAggregateType<T>>

    /**
     * Group by Season.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SeasonGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SeasonGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SeasonGroupByArgs['orderBy'] }
        : { orderBy?: SeasonGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SeasonGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSeasonGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Season model
   */
  readonly fields: SeasonFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Season.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SeasonClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    tournament<T extends Season$tournamentArgs<ExtArgs> = {}>(args?: Subset<T, Season$tournamentArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TournamentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Season model
   */
  interface SeasonFieldRefs {
    readonly id: FieldRef<"Season", 'String'>
    readonly name: FieldRef<"Season", 'String'>
    readonly description: FieldRef<"Season", 'String'>
    readonly startDate: FieldRef<"Season", 'DateTime'>
    readonly endDate: FieldRef<"Season", 'DateTime'>
    readonly status: FieldRef<"Season", 'SeasonStatus'>
    readonly createdBy: FieldRef<"Season", 'String'>
    readonly createdAt: FieldRef<"Season", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Season findUnique
   */
  export type SeasonFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Season
     */
    select?: SeasonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Season
     */
    omit?: SeasonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SeasonInclude<ExtArgs> | null
    /**
     * Filter, which Season to fetch.
     */
    where: SeasonWhereUniqueInput
  }

  /**
   * Season findUniqueOrThrow
   */
  export type SeasonFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Season
     */
    select?: SeasonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Season
     */
    omit?: SeasonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SeasonInclude<ExtArgs> | null
    /**
     * Filter, which Season to fetch.
     */
    where: SeasonWhereUniqueInput
  }

  /**
   * Season findFirst
   */
  export type SeasonFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Season
     */
    select?: SeasonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Season
     */
    omit?: SeasonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SeasonInclude<ExtArgs> | null
    /**
     * Filter, which Season to fetch.
     */
    where?: SeasonWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Seasons to fetch.
     */
    orderBy?: SeasonOrderByWithRelationInput | SeasonOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Seasons.
     */
    cursor?: SeasonWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Seasons from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Seasons.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Seasons.
     */
    distinct?: SeasonScalarFieldEnum | SeasonScalarFieldEnum[]
  }

  /**
   * Season findFirstOrThrow
   */
  export type SeasonFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Season
     */
    select?: SeasonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Season
     */
    omit?: SeasonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SeasonInclude<ExtArgs> | null
    /**
     * Filter, which Season to fetch.
     */
    where?: SeasonWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Seasons to fetch.
     */
    orderBy?: SeasonOrderByWithRelationInput | SeasonOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Seasons.
     */
    cursor?: SeasonWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Seasons from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Seasons.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Seasons.
     */
    distinct?: SeasonScalarFieldEnum | SeasonScalarFieldEnum[]
  }

  /**
   * Season findMany
   */
  export type SeasonFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Season
     */
    select?: SeasonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Season
     */
    omit?: SeasonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SeasonInclude<ExtArgs> | null
    /**
     * Filter, which Seasons to fetch.
     */
    where?: SeasonWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Seasons to fetch.
     */
    orderBy?: SeasonOrderByWithRelationInput | SeasonOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Seasons.
     */
    cursor?: SeasonWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Seasons from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Seasons.
     */
    skip?: number
    distinct?: SeasonScalarFieldEnum | SeasonScalarFieldEnum[]
  }

  /**
   * Season create
   */
  export type SeasonCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Season
     */
    select?: SeasonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Season
     */
    omit?: SeasonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SeasonInclude<ExtArgs> | null
    /**
     * The data needed to create a Season.
     */
    data: XOR<SeasonCreateInput, SeasonUncheckedCreateInput>
  }

  /**
   * Season createMany
   */
  export type SeasonCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Seasons.
     */
    data: SeasonCreateManyInput | SeasonCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Season createManyAndReturn
   */
  export type SeasonCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Season
     */
    select?: SeasonSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Season
     */
    omit?: SeasonOmit<ExtArgs> | null
    /**
     * The data used to create many Seasons.
     */
    data: SeasonCreateManyInput | SeasonCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Season update
   */
  export type SeasonUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Season
     */
    select?: SeasonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Season
     */
    omit?: SeasonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SeasonInclude<ExtArgs> | null
    /**
     * The data needed to update a Season.
     */
    data: XOR<SeasonUpdateInput, SeasonUncheckedUpdateInput>
    /**
     * Choose, which Season to update.
     */
    where: SeasonWhereUniqueInput
  }

  /**
   * Season updateMany
   */
  export type SeasonUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Seasons.
     */
    data: XOR<SeasonUpdateManyMutationInput, SeasonUncheckedUpdateManyInput>
    /**
     * Filter which Seasons to update
     */
    where?: SeasonWhereInput
    /**
     * Limit how many Seasons to update.
     */
    limit?: number
  }

  /**
   * Season updateManyAndReturn
   */
  export type SeasonUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Season
     */
    select?: SeasonSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Season
     */
    omit?: SeasonOmit<ExtArgs> | null
    /**
     * The data used to update Seasons.
     */
    data: XOR<SeasonUpdateManyMutationInput, SeasonUncheckedUpdateManyInput>
    /**
     * Filter which Seasons to update
     */
    where?: SeasonWhereInput
    /**
     * Limit how many Seasons to update.
     */
    limit?: number
  }

  /**
   * Season upsert
   */
  export type SeasonUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Season
     */
    select?: SeasonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Season
     */
    omit?: SeasonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SeasonInclude<ExtArgs> | null
    /**
     * The filter to search for the Season to update in case it exists.
     */
    where: SeasonWhereUniqueInput
    /**
     * In case the Season found by the `where` argument doesn't exist, create a new Season with this data.
     */
    create: XOR<SeasonCreateInput, SeasonUncheckedCreateInput>
    /**
     * In case the Season was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SeasonUpdateInput, SeasonUncheckedUpdateInput>
  }

  /**
   * Season delete
   */
  export type SeasonDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Season
     */
    select?: SeasonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Season
     */
    omit?: SeasonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SeasonInclude<ExtArgs> | null
    /**
     * Filter which Season to delete.
     */
    where: SeasonWhereUniqueInput
  }

  /**
   * Season deleteMany
   */
  export type SeasonDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Seasons to delete
     */
    where?: SeasonWhereInput
    /**
     * Limit how many Seasons to delete.
     */
    limit?: number
  }

  /**
   * Season.tournament
   */
  export type Season$tournamentArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tournament
     */
    select?: TournamentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tournament
     */
    omit?: TournamentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TournamentInclude<ExtArgs> | null
    where?: TournamentWhereInput
    orderBy?: TournamentOrderByWithRelationInput | TournamentOrderByWithRelationInput[]
    cursor?: TournamentWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TournamentScalarFieldEnum | TournamentScalarFieldEnum[]
  }

  /**
   * Season without action
   */
  export type SeasonDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Season
     */
    select?: SeasonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Season
     */
    omit?: SeasonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SeasonInclude<ExtArgs> | null
  }


  /**
   * Model Tournament
   */

  export type AggregateTournament = {
    _count: TournamentCountAggregateOutputType | null
    _avg: TournamentAvgAggregateOutputType | null
    _sum: TournamentSumAggregateOutputType | null
    _min: TournamentMinAggregateOutputType | null
    _max: TournamentMaxAggregateOutputType | null
  }

  export type TournamentAvgAggregateOutputType = {
    fee: number | null
  }

  export type TournamentSumAggregateOutputType = {
    fee: number | null
  }

  export type TournamentMinAggregateOutputType = {
    id: string | null
    name: string | null
    startDate: Date | null
    fee: number | null
    seasonId: string | null
    createdBy: string | null
    createdAt: Date | null
    galleryId: string | null
  }

  export type TournamentMaxAggregateOutputType = {
    id: string | null
    name: string | null
    startDate: Date | null
    fee: number | null
    seasonId: string | null
    createdBy: string | null
    createdAt: Date | null
    galleryId: string | null
  }

  export type TournamentCountAggregateOutputType = {
    id: number
    name: number
    startDate: number
    fee: number
    seasonId: number
    createdBy: number
    createdAt: number
    galleryId: number
    _all: number
  }


  export type TournamentAvgAggregateInputType = {
    fee?: true
  }

  export type TournamentSumAggregateInputType = {
    fee?: true
  }

  export type TournamentMinAggregateInputType = {
    id?: true
    name?: true
    startDate?: true
    fee?: true
    seasonId?: true
    createdBy?: true
    createdAt?: true
    galleryId?: true
  }

  export type TournamentMaxAggregateInputType = {
    id?: true
    name?: true
    startDate?: true
    fee?: true
    seasonId?: true
    createdBy?: true
    createdAt?: true
    galleryId?: true
  }

  export type TournamentCountAggregateInputType = {
    id?: true
    name?: true
    startDate?: true
    fee?: true
    seasonId?: true
    createdBy?: true
    createdAt?: true
    galleryId?: true
    _all?: true
  }

  export type TournamentAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Tournament to aggregate.
     */
    where?: TournamentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tournaments to fetch.
     */
    orderBy?: TournamentOrderByWithRelationInput | TournamentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TournamentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tournaments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tournaments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Tournaments
    **/
    _count?: true | TournamentCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TournamentAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TournamentSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TournamentMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TournamentMaxAggregateInputType
  }

  export type GetTournamentAggregateType<T extends TournamentAggregateArgs> = {
        [P in keyof T & keyof AggregateTournament]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTournament[P]>
      : GetScalarType<T[P], AggregateTournament[P]>
  }




  export type TournamentGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TournamentWhereInput
    orderBy?: TournamentOrderByWithAggregationInput | TournamentOrderByWithAggregationInput[]
    by: TournamentScalarFieldEnum[] | TournamentScalarFieldEnum
    having?: TournamentScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TournamentCountAggregateInputType | true
    _avg?: TournamentAvgAggregateInputType
    _sum?: TournamentSumAggregateInputType
    _min?: TournamentMinAggregateInputType
    _max?: TournamentMaxAggregateInputType
  }

  export type TournamentGroupByOutputType = {
    id: string
    name: string
    startDate: Date
    fee: number | null
    seasonId: string | null
    createdBy: string | null
    createdAt: Date
    galleryId: string | null
    _count: TournamentCountAggregateOutputType | null
    _avg: TournamentAvgAggregateOutputType | null
    _sum: TournamentSumAggregateOutputType | null
    _min: TournamentMinAggregateOutputType | null
    _max: TournamentMaxAggregateOutputType | null
  }

  type GetTournamentGroupByPayload<T extends TournamentGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TournamentGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TournamentGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TournamentGroupByOutputType[P]>
            : GetScalarType<T[P], TournamentGroupByOutputType[P]>
        }
      >
    >


  export type TournamentSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    startDate?: boolean
    fee?: boolean
    seasonId?: boolean
    createdBy?: boolean
    createdAt?: boolean
    galleryId?: boolean
    team?: boolean | Tournament$teamArgs<ExtArgs>
    user?: boolean | Tournament$userArgs<ExtArgs>
    season?: boolean | Tournament$seasonArgs<ExtArgs>
    tournamentWinner?: boolean | Tournament$tournamentWinnerArgs<ExtArgs>
    pollVote?: boolean | Tournament$pollVoteArgs<ExtArgs>
    match?: boolean | Tournament$matchArgs<ExtArgs>
    gallery?: boolean | Tournament$galleryArgs<ExtArgs>
    _count?: boolean | TournamentCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["tournament"]>

  export type TournamentSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    startDate?: boolean
    fee?: boolean
    seasonId?: boolean
    createdBy?: boolean
    createdAt?: boolean
    galleryId?: boolean
    season?: boolean | Tournament$seasonArgs<ExtArgs>
    gallery?: boolean | Tournament$galleryArgs<ExtArgs>
  }, ExtArgs["result"]["tournament"]>

  export type TournamentSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    startDate?: boolean
    fee?: boolean
    seasonId?: boolean
    createdBy?: boolean
    createdAt?: boolean
    galleryId?: boolean
    season?: boolean | Tournament$seasonArgs<ExtArgs>
    gallery?: boolean | Tournament$galleryArgs<ExtArgs>
  }, ExtArgs["result"]["tournament"]>

  export type TournamentSelectScalar = {
    id?: boolean
    name?: boolean
    startDate?: boolean
    fee?: boolean
    seasonId?: boolean
    createdBy?: boolean
    createdAt?: boolean
    galleryId?: boolean
  }

  export type TournamentOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "startDate" | "fee" | "seasonId" | "createdBy" | "createdAt" | "galleryId", ExtArgs["result"]["tournament"]>
  export type TournamentInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    team?: boolean | Tournament$teamArgs<ExtArgs>
    user?: boolean | Tournament$userArgs<ExtArgs>
    season?: boolean | Tournament$seasonArgs<ExtArgs>
    tournamentWinner?: boolean | Tournament$tournamentWinnerArgs<ExtArgs>
    pollVote?: boolean | Tournament$pollVoteArgs<ExtArgs>
    match?: boolean | Tournament$matchArgs<ExtArgs>
    gallery?: boolean | Tournament$galleryArgs<ExtArgs>
    _count?: boolean | TournamentCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type TournamentIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    season?: boolean | Tournament$seasonArgs<ExtArgs>
    gallery?: boolean | Tournament$galleryArgs<ExtArgs>
  }
  export type TournamentIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    season?: boolean | Tournament$seasonArgs<ExtArgs>
    gallery?: boolean | Tournament$galleryArgs<ExtArgs>
  }

  export type $TournamentPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Tournament"
    objects: {
      team: Prisma.$TeamPayload<ExtArgs>[]
      user: Prisma.$UserPayload<ExtArgs>[]
      season: Prisma.$SeasonPayload<ExtArgs> | null
      tournamentWinner: Prisma.$TournamentWinnerPayload<ExtArgs>[]
      pollVote: Prisma.$PollVotePayload<ExtArgs>[]
      match: Prisma.$MatchPayload<ExtArgs>[]
      gallery: Prisma.$GalleryPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      startDate: Date
      fee: number | null
      seasonId: string | null
      createdBy: string | null
      createdAt: Date
      galleryId: string | null
    }, ExtArgs["result"]["tournament"]>
    composites: {}
  }

  type TournamentGetPayload<S extends boolean | null | undefined | TournamentDefaultArgs> = $Result.GetResult<Prisma.$TournamentPayload, S>

  type TournamentCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TournamentFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TournamentCountAggregateInputType | true
    }

  export interface TournamentDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Tournament'], meta: { name: 'Tournament' } }
    /**
     * Find zero or one Tournament that matches the filter.
     * @param {TournamentFindUniqueArgs} args - Arguments to find a Tournament
     * @example
     * // Get one Tournament
     * const tournament = await prisma.tournament.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TournamentFindUniqueArgs>(args: SelectSubset<T, TournamentFindUniqueArgs<ExtArgs>>): Prisma__TournamentClient<$Result.GetResult<Prisma.$TournamentPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Tournament that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TournamentFindUniqueOrThrowArgs} args - Arguments to find a Tournament
     * @example
     * // Get one Tournament
     * const tournament = await prisma.tournament.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TournamentFindUniqueOrThrowArgs>(args: SelectSubset<T, TournamentFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TournamentClient<$Result.GetResult<Prisma.$TournamentPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Tournament that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TournamentFindFirstArgs} args - Arguments to find a Tournament
     * @example
     * // Get one Tournament
     * const tournament = await prisma.tournament.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TournamentFindFirstArgs>(args?: SelectSubset<T, TournamentFindFirstArgs<ExtArgs>>): Prisma__TournamentClient<$Result.GetResult<Prisma.$TournamentPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Tournament that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TournamentFindFirstOrThrowArgs} args - Arguments to find a Tournament
     * @example
     * // Get one Tournament
     * const tournament = await prisma.tournament.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TournamentFindFirstOrThrowArgs>(args?: SelectSubset<T, TournamentFindFirstOrThrowArgs<ExtArgs>>): Prisma__TournamentClient<$Result.GetResult<Prisma.$TournamentPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Tournaments that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TournamentFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Tournaments
     * const tournaments = await prisma.tournament.findMany()
     * 
     * // Get first 10 Tournaments
     * const tournaments = await prisma.tournament.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const tournamentWithIdOnly = await prisma.tournament.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TournamentFindManyArgs>(args?: SelectSubset<T, TournamentFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TournamentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Tournament.
     * @param {TournamentCreateArgs} args - Arguments to create a Tournament.
     * @example
     * // Create one Tournament
     * const Tournament = await prisma.tournament.create({
     *   data: {
     *     // ... data to create a Tournament
     *   }
     * })
     * 
     */
    create<T extends TournamentCreateArgs>(args: SelectSubset<T, TournamentCreateArgs<ExtArgs>>): Prisma__TournamentClient<$Result.GetResult<Prisma.$TournamentPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Tournaments.
     * @param {TournamentCreateManyArgs} args - Arguments to create many Tournaments.
     * @example
     * // Create many Tournaments
     * const tournament = await prisma.tournament.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TournamentCreateManyArgs>(args?: SelectSubset<T, TournamentCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Tournaments and returns the data saved in the database.
     * @param {TournamentCreateManyAndReturnArgs} args - Arguments to create many Tournaments.
     * @example
     * // Create many Tournaments
     * const tournament = await prisma.tournament.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Tournaments and only return the `id`
     * const tournamentWithIdOnly = await prisma.tournament.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TournamentCreateManyAndReturnArgs>(args?: SelectSubset<T, TournamentCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TournamentPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Tournament.
     * @param {TournamentDeleteArgs} args - Arguments to delete one Tournament.
     * @example
     * // Delete one Tournament
     * const Tournament = await prisma.tournament.delete({
     *   where: {
     *     // ... filter to delete one Tournament
     *   }
     * })
     * 
     */
    delete<T extends TournamentDeleteArgs>(args: SelectSubset<T, TournamentDeleteArgs<ExtArgs>>): Prisma__TournamentClient<$Result.GetResult<Prisma.$TournamentPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Tournament.
     * @param {TournamentUpdateArgs} args - Arguments to update one Tournament.
     * @example
     * // Update one Tournament
     * const tournament = await prisma.tournament.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TournamentUpdateArgs>(args: SelectSubset<T, TournamentUpdateArgs<ExtArgs>>): Prisma__TournamentClient<$Result.GetResult<Prisma.$TournamentPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Tournaments.
     * @param {TournamentDeleteManyArgs} args - Arguments to filter Tournaments to delete.
     * @example
     * // Delete a few Tournaments
     * const { count } = await prisma.tournament.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TournamentDeleteManyArgs>(args?: SelectSubset<T, TournamentDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Tournaments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TournamentUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Tournaments
     * const tournament = await prisma.tournament.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TournamentUpdateManyArgs>(args: SelectSubset<T, TournamentUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Tournaments and returns the data updated in the database.
     * @param {TournamentUpdateManyAndReturnArgs} args - Arguments to update many Tournaments.
     * @example
     * // Update many Tournaments
     * const tournament = await prisma.tournament.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Tournaments and only return the `id`
     * const tournamentWithIdOnly = await prisma.tournament.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TournamentUpdateManyAndReturnArgs>(args: SelectSubset<T, TournamentUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TournamentPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Tournament.
     * @param {TournamentUpsertArgs} args - Arguments to update or create a Tournament.
     * @example
     * // Update or create a Tournament
     * const tournament = await prisma.tournament.upsert({
     *   create: {
     *     // ... data to create a Tournament
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Tournament we want to update
     *   }
     * })
     */
    upsert<T extends TournamentUpsertArgs>(args: SelectSubset<T, TournamentUpsertArgs<ExtArgs>>): Prisma__TournamentClient<$Result.GetResult<Prisma.$TournamentPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Tournaments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TournamentCountArgs} args - Arguments to filter Tournaments to count.
     * @example
     * // Count the number of Tournaments
     * const count = await prisma.tournament.count({
     *   where: {
     *     // ... the filter for the Tournaments we want to count
     *   }
     * })
    **/
    count<T extends TournamentCountArgs>(
      args?: Subset<T, TournamentCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TournamentCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Tournament.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TournamentAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TournamentAggregateArgs>(args: Subset<T, TournamentAggregateArgs>): Prisma.PrismaPromise<GetTournamentAggregateType<T>>

    /**
     * Group by Tournament.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TournamentGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TournamentGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TournamentGroupByArgs['orderBy'] }
        : { orderBy?: TournamentGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TournamentGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTournamentGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Tournament model
   */
  readonly fields: TournamentFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Tournament.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TournamentClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    team<T extends Tournament$teamArgs<ExtArgs> = {}>(args?: Subset<T, Tournament$teamArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TeamPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    user<T extends Tournament$userArgs<ExtArgs> = {}>(args?: Subset<T, Tournament$userArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    season<T extends Tournament$seasonArgs<ExtArgs> = {}>(args?: Subset<T, Tournament$seasonArgs<ExtArgs>>): Prisma__SeasonClient<$Result.GetResult<Prisma.$SeasonPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    tournamentWinner<T extends Tournament$tournamentWinnerArgs<ExtArgs> = {}>(args?: Subset<T, Tournament$tournamentWinnerArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TournamentWinnerPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    pollVote<T extends Tournament$pollVoteArgs<ExtArgs> = {}>(args?: Subset<T, Tournament$pollVoteArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PollVotePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    match<T extends Tournament$matchArgs<ExtArgs> = {}>(args?: Subset<T, Tournament$matchArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MatchPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    gallery<T extends Tournament$galleryArgs<ExtArgs> = {}>(args?: Subset<T, Tournament$galleryArgs<ExtArgs>>): Prisma__GalleryClient<$Result.GetResult<Prisma.$GalleryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Tournament model
   */
  interface TournamentFieldRefs {
    readonly id: FieldRef<"Tournament", 'String'>
    readonly name: FieldRef<"Tournament", 'String'>
    readonly startDate: FieldRef<"Tournament", 'DateTime'>
    readonly fee: FieldRef<"Tournament", 'Int'>
    readonly seasonId: FieldRef<"Tournament", 'String'>
    readonly createdBy: FieldRef<"Tournament", 'String'>
    readonly createdAt: FieldRef<"Tournament", 'DateTime'>
    readonly galleryId: FieldRef<"Tournament", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Tournament findUnique
   */
  export type TournamentFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tournament
     */
    select?: TournamentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tournament
     */
    omit?: TournamentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TournamentInclude<ExtArgs> | null
    /**
     * Filter, which Tournament to fetch.
     */
    where: TournamentWhereUniqueInput
  }

  /**
   * Tournament findUniqueOrThrow
   */
  export type TournamentFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tournament
     */
    select?: TournamentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tournament
     */
    omit?: TournamentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TournamentInclude<ExtArgs> | null
    /**
     * Filter, which Tournament to fetch.
     */
    where: TournamentWhereUniqueInput
  }

  /**
   * Tournament findFirst
   */
  export type TournamentFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tournament
     */
    select?: TournamentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tournament
     */
    omit?: TournamentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TournamentInclude<ExtArgs> | null
    /**
     * Filter, which Tournament to fetch.
     */
    where?: TournamentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tournaments to fetch.
     */
    orderBy?: TournamentOrderByWithRelationInput | TournamentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Tournaments.
     */
    cursor?: TournamentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tournaments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tournaments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Tournaments.
     */
    distinct?: TournamentScalarFieldEnum | TournamentScalarFieldEnum[]
  }

  /**
   * Tournament findFirstOrThrow
   */
  export type TournamentFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tournament
     */
    select?: TournamentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tournament
     */
    omit?: TournamentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TournamentInclude<ExtArgs> | null
    /**
     * Filter, which Tournament to fetch.
     */
    where?: TournamentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tournaments to fetch.
     */
    orderBy?: TournamentOrderByWithRelationInput | TournamentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Tournaments.
     */
    cursor?: TournamentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tournaments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tournaments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Tournaments.
     */
    distinct?: TournamentScalarFieldEnum | TournamentScalarFieldEnum[]
  }

  /**
   * Tournament findMany
   */
  export type TournamentFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tournament
     */
    select?: TournamentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tournament
     */
    omit?: TournamentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TournamentInclude<ExtArgs> | null
    /**
     * Filter, which Tournaments to fetch.
     */
    where?: TournamentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tournaments to fetch.
     */
    orderBy?: TournamentOrderByWithRelationInput | TournamentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Tournaments.
     */
    cursor?: TournamentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tournaments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tournaments.
     */
    skip?: number
    distinct?: TournamentScalarFieldEnum | TournamentScalarFieldEnum[]
  }

  /**
   * Tournament create
   */
  export type TournamentCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tournament
     */
    select?: TournamentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tournament
     */
    omit?: TournamentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TournamentInclude<ExtArgs> | null
    /**
     * The data needed to create a Tournament.
     */
    data: XOR<TournamentCreateInput, TournamentUncheckedCreateInput>
  }

  /**
   * Tournament createMany
   */
  export type TournamentCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Tournaments.
     */
    data: TournamentCreateManyInput | TournamentCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Tournament createManyAndReturn
   */
  export type TournamentCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tournament
     */
    select?: TournamentSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Tournament
     */
    omit?: TournamentOmit<ExtArgs> | null
    /**
     * The data used to create many Tournaments.
     */
    data: TournamentCreateManyInput | TournamentCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TournamentIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Tournament update
   */
  export type TournamentUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tournament
     */
    select?: TournamentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tournament
     */
    omit?: TournamentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TournamentInclude<ExtArgs> | null
    /**
     * The data needed to update a Tournament.
     */
    data: XOR<TournamentUpdateInput, TournamentUncheckedUpdateInput>
    /**
     * Choose, which Tournament to update.
     */
    where: TournamentWhereUniqueInput
  }

  /**
   * Tournament updateMany
   */
  export type TournamentUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Tournaments.
     */
    data: XOR<TournamentUpdateManyMutationInput, TournamentUncheckedUpdateManyInput>
    /**
     * Filter which Tournaments to update
     */
    where?: TournamentWhereInput
    /**
     * Limit how many Tournaments to update.
     */
    limit?: number
  }

  /**
   * Tournament updateManyAndReturn
   */
  export type TournamentUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tournament
     */
    select?: TournamentSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Tournament
     */
    omit?: TournamentOmit<ExtArgs> | null
    /**
     * The data used to update Tournaments.
     */
    data: XOR<TournamentUpdateManyMutationInput, TournamentUncheckedUpdateManyInput>
    /**
     * Filter which Tournaments to update
     */
    where?: TournamentWhereInput
    /**
     * Limit how many Tournaments to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TournamentIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Tournament upsert
   */
  export type TournamentUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tournament
     */
    select?: TournamentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tournament
     */
    omit?: TournamentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TournamentInclude<ExtArgs> | null
    /**
     * The filter to search for the Tournament to update in case it exists.
     */
    where: TournamentWhereUniqueInput
    /**
     * In case the Tournament found by the `where` argument doesn't exist, create a new Tournament with this data.
     */
    create: XOR<TournamentCreateInput, TournamentUncheckedCreateInput>
    /**
     * In case the Tournament was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TournamentUpdateInput, TournamentUncheckedUpdateInput>
  }

  /**
   * Tournament delete
   */
  export type TournamentDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tournament
     */
    select?: TournamentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tournament
     */
    omit?: TournamentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TournamentInclude<ExtArgs> | null
    /**
     * Filter which Tournament to delete.
     */
    where: TournamentWhereUniqueInput
  }

  /**
   * Tournament deleteMany
   */
  export type TournamentDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Tournaments to delete
     */
    where?: TournamentWhereInput
    /**
     * Limit how many Tournaments to delete.
     */
    limit?: number
  }

  /**
   * Tournament.team
   */
  export type Tournament$teamArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Team
     */
    select?: TeamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Team
     */
    omit?: TeamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamInclude<ExtArgs> | null
    where?: TeamWhereInput
    orderBy?: TeamOrderByWithRelationInput | TeamOrderByWithRelationInput[]
    cursor?: TeamWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TeamScalarFieldEnum | TeamScalarFieldEnum[]
  }

  /**
   * Tournament.user
   */
  export type Tournament$userArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    where?: UserWhereInput
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    cursor?: UserWhereUniqueInput
    take?: number
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * Tournament.season
   */
  export type Tournament$seasonArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Season
     */
    select?: SeasonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Season
     */
    omit?: SeasonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SeasonInclude<ExtArgs> | null
    where?: SeasonWhereInput
  }

  /**
   * Tournament.tournamentWinner
   */
  export type Tournament$tournamentWinnerArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TournamentWinner
     */
    select?: TournamentWinnerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TournamentWinner
     */
    omit?: TournamentWinnerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TournamentWinnerInclude<ExtArgs> | null
    where?: TournamentWinnerWhereInput
    orderBy?: TournamentWinnerOrderByWithRelationInput | TournamentWinnerOrderByWithRelationInput[]
    cursor?: TournamentWinnerWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TournamentWinnerScalarFieldEnum | TournamentWinnerScalarFieldEnum[]
  }

  /**
   * Tournament.pollVote
   */
  export type Tournament$pollVoteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PollVote
     */
    select?: PollVoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PollVote
     */
    omit?: PollVoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PollVoteInclude<ExtArgs> | null
    where?: PollVoteWhereInput
    orderBy?: PollVoteOrderByWithRelationInput | PollVoteOrderByWithRelationInput[]
    cursor?: PollVoteWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PollVoteScalarFieldEnum | PollVoteScalarFieldEnum[]
  }

  /**
   * Tournament.match
   */
  export type Tournament$matchArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Match
     */
    select?: MatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Match
     */
    omit?: MatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchInclude<ExtArgs> | null
    where?: MatchWhereInput
    orderBy?: MatchOrderByWithRelationInput | MatchOrderByWithRelationInput[]
    cursor?: MatchWhereUniqueInput
    take?: number
    skip?: number
    distinct?: MatchScalarFieldEnum | MatchScalarFieldEnum[]
  }

  /**
   * Tournament.gallery
   */
  export type Tournament$galleryArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Gallery
     */
    select?: GallerySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Gallery
     */
    omit?: GalleryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GalleryInclude<ExtArgs> | null
    where?: GalleryWhereInput
  }

  /**
   * Tournament without action
   */
  export type TournamentDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tournament
     */
    select?: TournamentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tournament
     */
    omit?: TournamentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TournamentInclude<ExtArgs> | null
  }


  /**
   * Model PollVote
   */

  export type AggregatePollVote = {
    _count: PollVoteCountAggregateOutputType | null
    _min: PollVoteMinAggregateOutputType | null
    _max: PollVoteMaxAggregateOutputType | null
  }

  export type PollVoteMinAggregateOutputType = {
    id: string | null
    vote: $Enums.Vote | null
    inOption: string | null
    outOption: string | null
    soloOption: string | null
    startDate: Date | null
    endDate: Date | null
    playerId: string | null
    tournamentId: string | null
    createdAt: Date | null
  }

  export type PollVoteMaxAggregateOutputType = {
    id: string | null
    vote: $Enums.Vote | null
    inOption: string | null
    outOption: string | null
    soloOption: string | null
    startDate: Date | null
    endDate: Date | null
    playerId: string | null
    tournamentId: string | null
    createdAt: Date | null
  }

  export type PollVoteCountAggregateOutputType = {
    id: number
    vote: number
    inOption: number
    outOption: number
    soloOption: number
    startDate: number
    endDate: number
    playerId: number
    tournamentId: number
    createdAt: number
    _all: number
  }


  export type PollVoteMinAggregateInputType = {
    id?: true
    vote?: true
    inOption?: true
    outOption?: true
    soloOption?: true
    startDate?: true
    endDate?: true
    playerId?: true
    tournamentId?: true
    createdAt?: true
  }

  export type PollVoteMaxAggregateInputType = {
    id?: true
    vote?: true
    inOption?: true
    outOption?: true
    soloOption?: true
    startDate?: true
    endDate?: true
    playerId?: true
    tournamentId?: true
    createdAt?: true
  }

  export type PollVoteCountAggregateInputType = {
    id?: true
    vote?: true
    inOption?: true
    outOption?: true
    soloOption?: true
    startDate?: true
    endDate?: true
    playerId?: true
    tournamentId?: true
    createdAt?: true
    _all?: true
  }

  export type PollVoteAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PollVote to aggregate.
     */
    where?: PollVoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PollVotes to fetch.
     */
    orderBy?: PollVoteOrderByWithRelationInput | PollVoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PollVoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PollVotes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PollVotes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PollVotes
    **/
    _count?: true | PollVoteCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PollVoteMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PollVoteMaxAggregateInputType
  }

  export type GetPollVoteAggregateType<T extends PollVoteAggregateArgs> = {
        [P in keyof T & keyof AggregatePollVote]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePollVote[P]>
      : GetScalarType<T[P], AggregatePollVote[P]>
  }




  export type PollVoteGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PollVoteWhereInput
    orderBy?: PollVoteOrderByWithAggregationInput | PollVoteOrderByWithAggregationInput[]
    by: PollVoteScalarFieldEnum[] | PollVoteScalarFieldEnum
    having?: PollVoteScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PollVoteCountAggregateInputType | true
    _min?: PollVoteMinAggregateInputType
    _max?: PollVoteMaxAggregateInputType
  }

  export type PollVoteGroupByOutputType = {
    id: string
    vote: $Enums.Vote
    inOption: string
    outOption: string
    soloOption: string
    startDate: Date
    endDate: Date
    playerId: string
    tournamentId: string
    createdAt: Date
    _count: PollVoteCountAggregateOutputType | null
    _min: PollVoteMinAggregateOutputType | null
    _max: PollVoteMaxAggregateOutputType | null
  }

  type GetPollVoteGroupByPayload<T extends PollVoteGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PollVoteGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PollVoteGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PollVoteGroupByOutputType[P]>
            : GetScalarType<T[P], PollVoteGroupByOutputType[P]>
        }
      >
    >


  export type PollVoteSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    vote?: boolean
    inOption?: boolean
    outOption?: boolean
    soloOption?: boolean
    startDate?: boolean
    endDate?: boolean
    playerId?: boolean
    tournamentId?: boolean
    createdAt?: boolean
    player?: boolean | PlayerDefaultArgs<ExtArgs>
    tournament?: boolean | TournamentDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["pollVote"]>

  export type PollVoteSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    vote?: boolean
    inOption?: boolean
    outOption?: boolean
    soloOption?: boolean
    startDate?: boolean
    endDate?: boolean
    playerId?: boolean
    tournamentId?: boolean
    createdAt?: boolean
    player?: boolean | PlayerDefaultArgs<ExtArgs>
    tournament?: boolean | TournamentDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["pollVote"]>

  export type PollVoteSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    vote?: boolean
    inOption?: boolean
    outOption?: boolean
    soloOption?: boolean
    startDate?: boolean
    endDate?: boolean
    playerId?: boolean
    tournamentId?: boolean
    createdAt?: boolean
    player?: boolean | PlayerDefaultArgs<ExtArgs>
    tournament?: boolean | TournamentDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["pollVote"]>

  export type PollVoteSelectScalar = {
    id?: boolean
    vote?: boolean
    inOption?: boolean
    outOption?: boolean
    soloOption?: boolean
    startDate?: boolean
    endDate?: boolean
    playerId?: boolean
    tournamentId?: boolean
    createdAt?: boolean
  }

  export type PollVoteOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "vote" | "inOption" | "outOption" | "soloOption" | "startDate" | "endDate" | "playerId" | "tournamentId" | "createdAt", ExtArgs["result"]["pollVote"]>
  export type PollVoteInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    player?: boolean | PlayerDefaultArgs<ExtArgs>
    tournament?: boolean | TournamentDefaultArgs<ExtArgs>
  }
  export type PollVoteIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    player?: boolean | PlayerDefaultArgs<ExtArgs>
    tournament?: boolean | TournamentDefaultArgs<ExtArgs>
  }
  export type PollVoteIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    player?: boolean | PlayerDefaultArgs<ExtArgs>
    tournament?: boolean | TournamentDefaultArgs<ExtArgs>
  }

  export type $PollVotePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PollVote"
    objects: {
      player: Prisma.$PlayerPayload<ExtArgs>
      tournament: Prisma.$TournamentPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      vote: $Enums.Vote
      inOption: string
      outOption: string
      soloOption: string
      startDate: Date
      endDate: Date
      playerId: string
      tournamentId: string
      createdAt: Date
    }, ExtArgs["result"]["pollVote"]>
    composites: {}
  }

  type PollVoteGetPayload<S extends boolean | null | undefined | PollVoteDefaultArgs> = $Result.GetResult<Prisma.$PollVotePayload, S>

  type PollVoteCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PollVoteFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PollVoteCountAggregateInputType | true
    }

  export interface PollVoteDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PollVote'], meta: { name: 'PollVote' } }
    /**
     * Find zero or one PollVote that matches the filter.
     * @param {PollVoteFindUniqueArgs} args - Arguments to find a PollVote
     * @example
     * // Get one PollVote
     * const pollVote = await prisma.pollVote.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PollVoteFindUniqueArgs>(args: SelectSubset<T, PollVoteFindUniqueArgs<ExtArgs>>): Prisma__PollVoteClient<$Result.GetResult<Prisma.$PollVotePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one PollVote that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PollVoteFindUniqueOrThrowArgs} args - Arguments to find a PollVote
     * @example
     * // Get one PollVote
     * const pollVote = await prisma.pollVote.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PollVoteFindUniqueOrThrowArgs>(args: SelectSubset<T, PollVoteFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PollVoteClient<$Result.GetResult<Prisma.$PollVotePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PollVote that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PollVoteFindFirstArgs} args - Arguments to find a PollVote
     * @example
     * // Get one PollVote
     * const pollVote = await prisma.pollVote.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PollVoteFindFirstArgs>(args?: SelectSubset<T, PollVoteFindFirstArgs<ExtArgs>>): Prisma__PollVoteClient<$Result.GetResult<Prisma.$PollVotePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PollVote that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PollVoteFindFirstOrThrowArgs} args - Arguments to find a PollVote
     * @example
     * // Get one PollVote
     * const pollVote = await prisma.pollVote.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PollVoteFindFirstOrThrowArgs>(args?: SelectSubset<T, PollVoteFindFirstOrThrowArgs<ExtArgs>>): Prisma__PollVoteClient<$Result.GetResult<Prisma.$PollVotePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more PollVotes that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PollVoteFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PollVotes
     * const pollVotes = await prisma.pollVote.findMany()
     * 
     * // Get first 10 PollVotes
     * const pollVotes = await prisma.pollVote.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const pollVoteWithIdOnly = await prisma.pollVote.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PollVoteFindManyArgs>(args?: SelectSubset<T, PollVoteFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PollVotePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a PollVote.
     * @param {PollVoteCreateArgs} args - Arguments to create a PollVote.
     * @example
     * // Create one PollVote
     * const PollVote = await prisma.pollVote.create({
     *   data: {
     *     // ... data to create a PollVote
     *   }
     * })
     * 
     */
    create<T extends PollVoteCreateArgs>(args: SelectSubset<T, PollVoteCreateArgs<ExtArgs>>): Prisma__PollVoteClient<$Result.GetResult<Prisma.$PollVotePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many PollVotes.
     * @param {PollVoteCreateManyArgs} args - Arguments to create many PollVotes.
     * @example
     * // Create many PollVotes
     * const pollVote = await prisma.pollVote.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PollVoteCreateManyArgs>(args?: SelectSubset<T, PollVoteCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PollVotes and returns the data saved in the database.
     * @param {PollVoteCreateManyAndReturnArgs} args - Arguments to create many PollVotes.
     * @example
     * // Create many PollVotes
     * const pollVote = await prisma.pollVote.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PollVotes and only return the `id`
     * const pollVoteWithIdOnly = await prisma.pollVote.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PollVoteCreateManyAndReturnArgs>(args?: SelectSubset<T, PollVoteCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PollVotePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a PollVote.
     * @param {PollVoteDeleteArgs} args - Arguments to delete one PollVote.
     * @example
     * // Delete one PollVote
     * const PollVote = await prisma.pollVote.delete({
     *   where: {
     *     // ... filter to delete one PollVote
     *   }
     * })
     * 
     */
    delete<T extends PollVoteDeleteArgs>(args: SelectSubset<T, PollVoteDeleteArgs<ExtArgs>>): Prisma__PollVoteClient<$Result.GetResult<Prisma.$PollVotePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one PollVote.
     * @param {PollVoteUpdateArgs} args - Arguments to update one PollVote.
     * @example
     * // Update one PollVote
     * const pollVote = await prisma.pollVote.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PollVoteUpdateArgs>(args: SelectSubset<T, PollVoteUpdateArgs<ExtArgs>>): Prisma__PollVoteClient<$Result.GetResult<Prisma.$PollVotePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more PollVotes.
     * @param {PollVoteDeleteManyArgs} args - Arguments to filter PollVotes to delete.
     * @example
     * // Delete a few PollVotes
     * const { count } = await prisma.pollVote.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PollVoteDeleteManyArgs>(args?: SelectSubset<T, PollVoteDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PollVotes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PollVoteUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PollVotes
     * const pollVote = await prisma.pollVote.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PollVoteUpdateManyArgs>(args: SelectSubset<T, PollVoteUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PollVotes and returns the data updated in the database.
     * @param {PollVoteUpdateManyAndReturnArgs} args - Arguments to update many PollVotes.
     * @example
     * // Update many PollVotes
     * const pollVote = await prisma.pollVote.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more PollVotes and only return the `id`
     * const pollVoteWithIdOnly = await prisma.pollVote.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PollVoteUpdateManyAndReturnArgs>(args: SelectSubset<T, PollVoteUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PollVotePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one PollVote.
     * @param {PollVoteUpsertArgs} args - Arguments to update or create a PollVote.
     * @example
     * // Update or create a PollVote
     * const pollVote = await prisma.pollVote.upsert({
     *   create: {
     *     // ... data to create a PollVote
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PollVote we want to update
     *   }
     * })
     */
    upsert<T extends PollVoteUpsertArgs>(args: SelectSubset<T, PollVoteUpsertArgs<ExtArgs>>): Prisma__PollVoteClient<$Result.GetResult<Prisma.$PollVotePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of PollVotes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PollVoteCountArgs} args - Arguments to filter PollVotes to count.
     * @example
     * // Count the number of PollVotes
     * const count = await prisma.pollVote.count({
     *   where: {
     *     // ... the filter for the PollVotes we want to count
     *   }
     * })
    **/
    count<T extends PollVoteCountArgs>(
      args?: Subset<T, PollVoteCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PollVoteCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PollVote.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PollVoteAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PollVoteAggregateArgs>(args: Subset<T, PollVoteAggregateArgs>): Prisma.PrismaPromise<GetPollVoteAggregateType<T>>

    /**
     * Group by PollVote.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PollVoteGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PollVoteGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PollVoteGroupByArgs['orderBy'] }
        : { orderBy?: PollVoteGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PollVoteGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPollVoteGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PollVote model
   */
  readonly fields: PollVoteFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PollVote.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PollVoteClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    player<T extends PlayerDefaultArgs<ExtArgs> = {}>(args?: Subset<T, PlayerDefaultArgs<ExtArgs>>): Prisma__PlayerClient<$Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    tournament<T extends TournamentDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TournamentDefaultArgs<ExtArgs>>): Prisma__TournamentClient<$Result.GetResult<Prisma.$TournamentPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the PollVote model
   */
  interface PollVoteFieldRefs {
    readonly id: FieldRef<"PollVote", 'String'>
    readonly vote: FieldRef<"PollVote", 'Vote'>
    readonly inOption: FieldRef<"PollVote", 'String'>
    readonly outOption: FieldRef<"PollVote", 'String'>
    readonly soloOption: FieldRef<"PollVote", 'String'>
    readonly startDate: FieldRef<"PollVote", 'DateTime'>
    readonly endDate: FieldRef<"PollVote", 'DateTime'>
    readonly playerId: FieldRef<"PollVote", 'String'>
    readonly tournamentId: FieldRef<"PollVote", 'String'>
    readonly createdAt: FieldRef<"PollVote", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * PollVote findUnique
   */
  export type PollVoteFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PollVote
     */
    select?: PollVoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PollVote
     */
    omit?: PollVoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PollVoteInclude<ExtArgs> | null
    /**
     * Filter, which PollVote to fetch.
     */
    where: PollVoteWhereUniqueInput
  }

  /**
   * PollVote findUniqueOrThrow
   */
  export type PollVoteFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PollVote
     */
    select?: PollVoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PollVote
     */
    omit?: PollVoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PollVoteInclude<ExtArgs> | null
    /**
     * Filter, which PollVote to fetch.
     */
    where: PollVoteWhereUniqueInput
  }

  /**
   * PollVote findFirst
   */
  export type PollVoteFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PollVote
     */
    select?: PollVoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PollVote
     */
    omit?: PollVoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PollVoteInclude<ExtArgs> | null
    /**
     * Filter, which PollVote to fetch.
     */
    where?: PollVoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PollVotes to fetch.
     */
    orderBy?: PollVoteOrderByWithRelationInput | PollVoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PollVotes.
     */
    cursor?: PollVoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PollVotes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PollVotes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PollVotes.
     */
    distinct?: PollVoteScalarFieldEnum | PollVoteScalarFieldEnum[]
  }

  /**
   * PollVote findFirstOrThrow
   */
  export type PollVoteFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PollVote
     */
    select?: PollVoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PollVote
     */
    omit?: PollVoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PollVoteInclude<ExtArgs> | null
    /**
     * Filter, which PollVote to fetch.
     */
    where?: PollVoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PollVotes to fetch.
     */
    orderBy?: PollVoteOrderByWithRelationInput | PollVoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PollVotes.
     */
    cursor?: PollVoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PollVotes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PollVotes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PollVotes.
     */
    distinct?: PollVoteScalarFieldEnum | PollVoteScalarFieldEnum[]
  }

  /**
   * PollVote findMany
   */
  export type PollVoteFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PollVote
     */
    select?: PollVoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PollVote
     */
    omit?: PollVoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PollVoteInclude<ExtArgs> | null
    /**
     * Filter, which PollVotes to fetch.
     */
    where?: PollVoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PollVotes to fetch.
     */
    orderBy?: PollVoteOrderByWithRelationInput | PollVoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PollVotes.
     */
    cursor?: PollVoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PollVotes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PollVotes.
     */
    skip?: number
    distinct?: PollVoteScalarFieldEnum | PollVoteScalarFieldEnum[]
  }

  /**
   * PollVote create
   */
  export type PollVoteCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PollVote
     */
    select?: PollVoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PollVote
     */
    omit?: PollVoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PollVoteInclude<ExtArgs> | null
    /**
     * The data needed to create a PollVote.
     */
    data: XOR<PollVoteCreateInput, PollVoteUncheckedCreateInput>
  }

  /**
   * PollVote createMany
   */
  export type PollVoteCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PollVotes.
     */
    data: PollVoteCreateManyInput | PollVoteCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PollVote createManyAndReturn
   */
  export type PollVoteCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PollVote
     */
    select?: PollVoteSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PollVote
     */
    omit?: PollVoteOmit<ExtArgs> | null
    /**
     * The data used to create many PollVotes.
     */
    data: PollVoteCreateManyInput | PollVoteCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PollVoteIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * PollVote update
   */
  export type PollVoteUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PollVote
     */
    select?: PollVoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PollVote
     */
    omit?: PollVoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PollVoteInclude<ExtArgs> | null
    /**
     * The data needed to update a PollVote.
     */
    data: XOR<PollVoteUpdateInput, PollVoteUncheckedUpdateInput>
    /**
     * Choose, which PollVote to update.
     */
    where: PollVoteWhereUniqueInput
  }

  /**
   * PollVote updateMany
   */
  export type PollVoteUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PollVotes.
     */
    data: XOR<PollVoteUpdateManyMutationInput, PollVoteUncheckedUpdateManyInput>
    /**
     * Filter which PollVotes to update
     */
    where?: PollVoteWhereInput
    /**
     * Limit how many PollVotes to update.
     */
    limit?: number
  }

  /**
   * PollVote updateManyAndReturn
   */
  export type PollVoteUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PollVote
     */
    select?: PollVoteSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PollVote
     */
    omit?: PollVoteOmit<ExtArgs> | null
    /**
     * The data used to update PollVotes.
     */
    data: XOR<PollVoteUpdateManyMutationInput, PollVoteUncheckedUpdateManyInput>
    /**
     * Filter which PollVotes to update
     */
    where?: PollVoteWhereInput
    /**
     * Limit how many PollVotes to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PollVoteIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * PollVote upsert
   */
  export type PollVoteUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PollVote
     */
    select?: PollVoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PollVote
     */
    omit?: PollVoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PollVoteInclude<ExtArgs> | null
    /**
     * The filter to search for the PollVote to update in case it exists.
     */
    where: PollVoteWhereUniqueInput
    /**
     * In case the PollVote found by the `where` argument doesn't exist, create a new PollVote with this data.
     */
    create: XOR<PollVoteCreateInput, PollVoteUncheckedCreateInput>
    /**
     * In case the PollVote was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PollVoteUpdateInput, PollVoteUncheckedUpdateInput>
  }

  /**
   * PollVote delete
   */
  export type PollVoteDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PollVote
     */
    select?: PollVoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PollVote
     */
    omit?: PollVoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PollVoteInclude<ExtArgs> | null
    /**
     * Filter which PollVote to delete.
     */
    where: PollVoteWhereUniqueInput
  }

  /**
   * PollVote deleteMany
   */
  export type PollVoteDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PollVotes to delete
     */
    where?: PollVoteWhereInput
    /**
     * Limit how many PollVotes to delete.
     */
    limit?: number
  }

  /**
   * PollVote without action
   */
  export type PollVoteDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PollVote
     */
    select?: PollVoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PollVote
     */
    omit?: PollVoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PollVoteInclude<ExtArgs> | null
  }


  /**
   * Model TournamentWinner
   */

  export type AggregateTournamentWinner = {
    _count: TournamentWinnerCountAggregateOutputType | null
    _avg: TournamentWinnerAvgAggregateOutputType | null
    _sum: TournamentWinnerSumAggregateOutputType | null
    _min: TournamentWinnerMinAggregateOutputType | null
    _max: TournamentWinnerMaxAggregateOutputType | null
  }

  export type TournamentWinnerAvgAggregateOutputType = {
    position: number | null
  }

  export type TournamentWinnerSumAggregateOutputType = {
    position: number | null
  }

  export type TournamentWinnerMinAggregateOutputType = {
    id: string | null
    playerId: string | null
    position: number | null
    tournamentId: string | null
    createdAt: Date | null
  }

  export type TournamentWinnerMaxAggregateOutputType = {
    id: string | null
    playerId: string | null
    position: number | null
    tournamentId: string | null
    createdAt: Date | null
  }

  export type TournamentWinnerCountAggregateOutputType = {
    id: number
    playerId: number
    position: number
    tournamentId: number
    createdAt: number
    _all: number
  }


  export type TournamentWinnerAvgAggregateInputType = {
    position?: true
  }

  export type TournamentWinnerSumAggregateInputType = {
    position?: true
  }

  export type TournamentWinnerMinAggregateInputType = {
    id?: true
    playerId?: true
    position?: true
    tournamentId?: true
    createdAt?: true
  }

  export type TournamentWinnerMaxAggregateInputType = {
    id?: true
    playerId?: true
    position?: true
    tournamentId?: true
    createdAt?: true
  }

  export type TournamentWinnerCountAggregateInputType = {
    id?: true
    playerId?: true
    position?: true
    tournamentId?: true
    createdAt?: true
    _all?: true
  }

  export type TournamentWinnerAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TournamentWinner to aggregate.
     */
    where?: TournamentWinnerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TournamentWinners to fetch.
     */
    orderBy?: TournamentWinnerOrderByWithRelationInput | TournamentWinnerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TournamentWinnerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TournamentWinners from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TournamentWinners.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TournamentWinners
    **/
    _count?: true | TournamentWinnerCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TournamentWinnerAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TournamentWinnerSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TournamentWinnerMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TournamentWinnerMaxAggregateInputType
  }

  export type GetTournamentWinnerAggregateType<T extends TournamentWinnerAggregateArgs> = {
        [P in keyof T & keyof AggregateTournamentWinner]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTournamentWinner[P]>
      : GetScalarType<T[P], AggregateTournamentWinner[P]>
  }




  export type TournamentWinnerGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TournamentWinnerWhereInput
    orderBy?: TournamentWinnerOrderByWithAggregationInput | TournamentWinnerOrderByWithAggregationInput[]
    by: TournamentWinnerScalarFieldEnum[] | TournamentWinnerScalarFieldEnum
    having?: TournamentWinnerScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TournamentWinnerCountAggregateInputType | true
    _avg?: TournamentWinnerAvgAggregateInputType
    _sum?: TournamentWinnerSumAggregateInputType
    _min?: TournamentWinnerMinAggregateInputType
    _max?: TournamentWinnerMaxAggregateInputType
  }

  export type TournamentWinnerGroupByOutputType = {
    id: string
    playerId: string
    position: number
    tournamentId: string
    createdAt: Date
    _count: TournamentWinnerCountAggregateOutputType | null
    _avg: TournamentWinnerAvgAggregateOutputType | null
    _sum: TournamentWinnerSumAggregateOutputType | null
    _min: TournamentWinnerMinAggregateOutputType | null
    _max: TournamentWinnerMaxAggregateOutputType | null
  }

  type GetTournamentWinnerGroupByPayload<T extends TournamentWinnerGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TournamentWinnerGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TournamentWinnerGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TournamentWinnerGroupByOutputType[P]>
            : GetScalarType<T[P], TournamentWinnerGroupByOutputType[P]>
        }
      >
    >


  export type TournamentWinnerSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    playerId?: boolean
    position?: boolean
    tournamentId?: boolean
    createdAt?: boolean
    player?: boolean | PlayerDefaultArgs<ExtArgs>
    tournament?: boolean | TournamentDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["tournamentWinner"]>

  export type TournamentWinnerSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    playerId?: boolean
    position?: boolean
    tournamentId?: boolean
    createdAt?: boolean
    player?: boolean | PlayerDefaultArgs<ExtArgs>
    tournament?: boolean | TournamentDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["tournamentWinner"]>

  export type TournamentWinnerSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    playerId?: boolean
    position?: boolean
    tournamentId?: boolean
    createdAt?: boolean
    player?: boolean | PlayerDefaultArgs<ExtArgs>
    tournament?: boolean | TournamentDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["tournamentWinner"]>

  export type TournamentWinnerSelectScalar = {
    id?: boolean
    playerId?: boolean
    position?: boolean
    tournamentId?: boolean
    createdAt?: boolean
  }

  export type TournamentWinnerOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "playerId" | "position" | "tournamentId" | "createdAt", ExtArgs["result"]["tournamentWinner"]>
  export type TournamentWinnerInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    player?: boolean | PlayerDefaultArgs<ExtArgs>
    tournament?: boolean | TournamentDefaultArgs<ExtArgs>
  }
  export type TournamentWinnerIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    player?: boolean | PlayerDefaultArgs<ExtArgs>
    tournament?: boolean | TournamentDefaultArgs<ExtArgs>
  }
  export type TournamentWinnerIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    player?: boolean | PlayerDefaultArgs<ExtArgs>
    tournament?: boolean | TournamentDefaultArgs<ExtArgs>
  }

  export type $TournamentWinnerPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TournamentWinner"
    objects: {
      player: Prisma.$PlayerPayload<ExtArgs>
      tournament: Prisma.$TournamentPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      playerId: string
      position: number
      tournamentId: string
      createdAt: Date
    }, ExtArgs["result"]["tournamentWinner"]>
    composites: {}
  }

  type TournamentWinnerGetPayload<S extends boolean | null | undefined | TournamentWinnerDefaultArgs> = $Result.GetResult<Prisma.$TournamentWinnerPayload, S>

  type TournamentWinnerCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TournamentWinnerFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TournamentWinnerCountAggregateInputType | true
    }

  export interface TournamentWinnerDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TournamentWinner'], meta: { name: 'TournamentWinner' } }
    /**
     * Find zero or one TournamentWinner that matches the filter.
     * @param {TournamentWinnerFindUniqueArgs} args - Arguments to find a TournamentWinner
     * @example
     * // Get one TournamentWinner
     * const tournamentWinner = await prisma.tournamentWinner.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TournamentWinnerFindUniqueArgs>(args: SelectSubset<T, TournamentWinnerFindUniqueArgs<ExtArgs>>): Prisma__TournamentWinnerClient<$Result.GetResult<Prisma.$TournamentWinnerPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one TournamentWinner that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TournamentWinnerFindUniqueOrThrowArgs} args - Arguments to find a TournamentWinner
     * @example
     * // Get one TournamentWinner
     * const tournamentWinner = await prisma.tournamentWinner.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TournamentWinnerFindUniqueOrThrowArgs>(args: SelectSubset<T, TournamentWinnerFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TournamentWinnerClient<$Result.GetResult<Prisma.$TournamentWinnerPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TournamentWinner that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TournamentWinnerFindFirstArgs} args - Arguments to find a TournamentWinner
     * @example
     * // Get one TournamentWinner
     * const tournamentWinner = await prisma.tournamentWinner.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TournamentWinnerFindFirstArgs>(args?: SelectSubset<T, TournamentWinnerFindFirstArgs<ExtArgs>>): Prisma__TournamentWinnerClient<$Result.GetResult<Prisma.$TournamentWinnerPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TournamentWinner that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TournamentWinnerFindFirstOrThrowArgs} args - Arguments to find a TournamentWinner
     * @example
     * // Get one TournamentWinner
     * const tournamentWinner = await prisma.tournamentWinner.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TournamentWinnerFindFirstOrThrowArgs>(args?: SelectSubset<T, TournamentWinnerFindFirstOrThrowArgs<ExtArgs>>): Prisma__TournamentWinnerClient<$Result.GetResult<Prisma.$TournamentWinnerPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more TournamentWinners that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TournamentWinnerFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TournamentWinners
     * const tournamentWinners = await prisma.tournamentWinner.findMany()
     * 
     * // Get first 10 TournamentWinners
     * const tournamentWinners = await prisma.tournamentWinner.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const tournamentWinnerWithIdOnly = await prisma.tournamentWinner.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TournamentWinnerFindManyArgs>(args?: SelectSubset<T, TournamentWinnerFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TournamentWinnerPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a TournamentWinner.
     * @param {TournamentWinnerCreateArgs} args - Arguments to create a TournamentWinner.
     * @example
     * // Create one TournamentWinner
     * const TournamentWinner = await prisma.tournamentWinner.create({
     *   data: {
     *     // ... data to create a TournamentWinner
     *   }
     * })
     * 
     */
    create<T extends TournamentWinnerCreateArgs>(args: SelectSubset<T, TournamentWinnerCreateArgs<ExtArgs>>): Prisma__TournamentWinnerClient<$Result.GetResult<Prisma.$TournamentWinnerPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many TournamentWinners.
     * @param {TournamentWinnerCreateManyArgs} args - Arguments to create many TournamentWinners.
     * @example
     * // Create many TournamentWinners
     * const tournamentWinner = await prisma.tournamentWinner.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TournamentWinnerCreateManyArgs>(args?: SelectSubset<T, TournamentWinnerCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TournamentWinners and returns the data saved in the database.
     * @param {TournamentWinnerCreateManyAndReturnArgs} args - Arguments to create many TournamentWinners.
     * @example
     * // Create many TournamentWinners
     * const tournamentWinner = await prisma.tournamentWinner.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TournamentWinners and only return the `id`
     * const tournamentWinnerWithIdOnly = await prisma.tournamentWinner.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TournamentWinnerCreateManyAndReturnArgs>(args?: SelectSubset<T, TournamentWinnerCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TournamentWinnerPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a TournamentWinner.
     * @param {TournamentWinnerDeleteArgs} args - Arguments to delete one TournamentWinner.
     * @example
     * // Delete one TournamentWinner
     * const TournamentWinner = await prisma.tournamentWinner.delete({
     *   where: {
     *     // ... filter to delete one TournamentWinner
     *   }
     * })
     * 
     */
    delete<T extends TournamentWinnerDeleteArgs>(args: SelectSubset<T, TournamentWinnerDeleteArgs<ExtArgs>>): Prisma__TournamentWinnerClient<$Result.GetResult<Prisma.$TournamentWinnerPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one TournamentWinner.
     * @param {TournamentWinnerUpdateArgs} args - Arguments to update one TournamentWinner.
     * @example
     * // Update one TournamentWinner
     * const tournamentWinner = await prisma.tournamentWinner.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TournamentWinnerUpdateArgs>(args: SelectSubset<T, TournamentWinnerUpdateArgs<ExtArgs>>): Prisma__TournamentWinnerClient<$Result.GetResult<Prisma.$TournamentWinnerPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more TournamentWinners.
     * @param {TournamentWinnerDeleteManyArgs} args - Arguments to filter TournamentWinners to delete.
     * @example
     * // Delete a few TournamentWinners
     * const { count } = await prisma.tournamentWinner.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TournamentWinnerDeleteManyArgs>(args?: SelectSubset<T, TournamentWinnerDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TournamentWinners.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TournamentWinnerUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TournamentWinners
     * const tournamentWinner = await prisma.tournamentWinner.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TournamentWinnerUpdateManyArgs>(args: SelectSubset<T, TournamentWinnerUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TournamentWinners and returns the data updated in the database.
     * @param {TournamentWinnerUpdateManyAndReturnArgs} args - Arguments to update many TournamentWinners.
     * @example
     * // Update many TournamentWinners
     * const tournamentWinner = await prisma.tournamentWinner.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more TournamentWinners and only return the `id`
     * const tournamentWinnerWithIdOnly = await prisma.tournamentWinner.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TournamentWinnerUpdateManyAndReturnArgs>(args: SelectSubset<T, TournamentWinnerUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TournamentWinnerPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one TournamentWinner.
     * @param {TournamentWinnerUpsertArgs} args - Arguments to update or create a TournamentWinner.
     * @example
     * // Update or create a TournamentWinner
     * const tournamentWinner = await prisma.tournamentWinner.upsert({
     *   create: {
     *     // ... data to create a TournamentWinner
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TournamentWinner we want to update
     *   }
     * })
     */
    upsert<T extends TournamentWinnerUpsertArgs>(args: SelectSubset<T, TournamentWinnerUpsertArgs<ExtArgs>>): Prisma__TournamentWinnerClient<$Result.GetResult<Prisma.$TournamentWinnerPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of TournamentWinners.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TournamentWinnerCountArgs} args - Arguments to filter TournamentWinners to count.
     * @example
     * // Count the number of TournamentWinners
     * const count = await prisma.tournamentWinner.count({
     *   where: {
     *     // ... the filter for the TournamentWinners we want to count
     *   }
     * })
    **/
    count<T extends TournamentWinnerCountArgs>(
      args?: Subset<T, TournamentWinnerCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TournamentWinnerCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TournamentWinner.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TournamentWinnerAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TournamentWinnerAggregateArgs>(args: Subset<T, TournamentWinnerAggregateArgs>): Prisma.PrismaPromise<GetTournamentWinnerAggregateType<T>>

    /**
     * Group by TournamentWinner.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TournamentWinnerGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TournamentWinnerGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TournamentWinnerGroupByArgs['orderBy'] }
        : { orderBy?: TournamentWinnerGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TournamentWinnerGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTournamentWinnerGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TournamentWinner model
   */
  readonly fields: TournamentWinnerFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TournamentWinner.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TournamentWinnerClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    player<T extends PlayerDefaultArgs<ExtArgs> = {}>(args?: Subset<T, PlayerDefaultArgs<ExtArgs>>): Prisma__PlayerClient<$Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    tournament<T extends TournamentDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TournamentDefaultArgs<ExtArgs>>): Prisma__TournamentClient<$Result.GetResult<Prisma.$TournamentPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TournamentWinner model
   */
  interface TournamentWinnerFieldRefs {
    readonly id: FieldRef<"TournamentWinner", 'String'>
    readonly playerId: FieldRef<"TournamentWinner", 'String'>
    readonly position: FieldRef<"TournamentWinner", 'Int'>
    readonly tournamentId: FieldRef<"TournamentWinner", 'String'>
    readonly createdAt: FieldRef<"TournamentWinner", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * TournamentWinner findUnique
   */
  export type TournamentWinnerFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TournamentWinner
     */
    select?: TournamentWinnerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TournamentWinner
     */
    omit?: TournamentWinnerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TournamentWinnerInclude<ExtArgs> | null
    /**
     * Filter, which TournamentWinner to fetch.
     */
    where: TournamentWinnerWhereUniqueInput
  }

  /**
   * TournamentWinner findUniqueOrThrow
   */
  export type TournamentWinnerFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TournamentWinner
     */
    select?: TournamentWinnerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TournamentWinner
     */
    omit?: TournamentWinnerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TournamentWinnerInclude<ExtArgs> | null
    /**
     * Filter, which TournamentWinner to fetch.
     */
    where: TournamentWinnerWhereUniqueInput
  }

  /**
   * TournamentWinner findFirst
   */
  export type TournamentWinnerFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TournamentWinner
     */
    select?: TournamentWinnerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TournamentWinner
     */
    omit?: TournamentWinnerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TournamentWinnerInclude<ExtArgs> | null
    /**
     * Filter, which TournamentWinner to fetch.
     */
    where?: TournamentWinnerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TournamentWinners to fetch.
     */
    orderBy?: TournamentWinnerOrderByWithRelationInput | TournamentWinnerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TournamentWinners.
     */
    cursor?: TournamentWinnerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TournamentWinners from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TournamentWinners.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TournamentWinners.
     */
    distinct?: TournamentWinnerScalarFieldEnum | TournamentWinnerScalarFieldEnum[]
  }

  /**
   * TournamentWinner findFirstOrThrow
   */
  export type TournamentWinnerFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TournamentWinner
     */
    select?: TournamentWinnerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TournamentWinner
     */
    omit?: TournamentWinnerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TournamentWinnerInclude<ExtArgs> | null
    /**
     * Filter, which TournamentWinner to fetch.
     */
    where?: TournamentWinnerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TournamentWinners to fetch.
     */
    orderBy?: TournamentWinnerOrderByWithRelationInput | TournamentWinnerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TournamentWinners.
     */
    cursor?: TournamentWinnerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TournamentWinners from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TournamentWinners.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TournamentWinners.
     */
    distinct?: TournamentWinnerScalarFieldEnum | TournamentWinnerScalarFieldEnum[]
  }

  /**
   * TournamentWinner findMany
   */
  export type TournamentWinnerFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TournamentWinner
     */
    select?: TournamentWinnerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TournamentWinner
     */
    omit?: TournamentWinnerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TournamentWinnerInclude<ExtArgs> | null
    /**
     * Filter, which TournamentWinners to fetch.
     */
    where?: TournamentWinnerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TournamentWinners to fetch.
     */
    orderBy?: TournamentWinnerOrderByWithRelationInput | TournamentWinnerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TournamentWinners.
     */
    cursor?: TournamentWinnerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TournamentWinners from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TournamentWinners.
     */
    skip?: number
    distinct?: TournamentWinnerScalarFieldEnum | TournamentWinnerScalarFieldEnum[]
  }

  /**
   * TournamentWinner create
   */
  export type TournamentWinnerCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TournamentWinner
     */
    select?: TournamentWinnerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TournamentWinner
     */
    omit?: TournamentWinnerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TournamentWinnerInclude<ExtArgs> | null
    /**
     * The data needed to create a TournamentWinner.
     */
    data: XOR<TournamentWinnerCreateInput, TournamentWinnerUncheckedCreateInput>
  }

  /**
   * TournamentWinner createMany
   */
  export type TournamentWinnerCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TournamentWinners.
     */
    data: TournamentWinnerCreateManyInput | TournamentWinnerCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TournamentWinner createManyAndReturn
   */
  export type TournamentWinnerCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TournamentWinner
     */
    select?: TournamentWinnerSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TournamentWinner
     */
    omit?: TournamentWinnerOmit<ExtArgs> | null
    /**
     * The data used to create many TournamentWinners.
     */
    data: TournamentWinnerCreateManyInput | TournamentWinnerCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TournamentWinnerIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * TournamentWinner update
   */
  export type TournamentWinnerUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TournamentWinner
     */
    select?: TournamentWinnerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TournamentWinner
     */
    omit?: TournamentWinnerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TournamentWinnerInclude<ExtArgs> | null
    /**
     * The data needed to update a TournamentWinner.
     */
    data: XOR<TournamentWinnerUpdateInput, TournamentWinnerUncheckedUpdateInput>
    /**
     * Choose, which TournamentWinner to update.
     */
    where: TournamentWinnerWhereUniqueInput
  }

  /**
   * TournamentWinner updateMany
   */
  export type TournamentWinnerUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TournamentWinners.
     */
    data: XOR<TournamentWinnerUpdateManyMutationInput, TournamentWinnerUncheckedUpdateManyInput>
    /**
     * Filter which TournamentWinners to update
     */
    where?: TournamentWinnerWhereInput
    /**
     * Limit how many TournamentWinners to update.
     */
    limit?: number
  }

  /**
   * TournamentWinner updateManyAndReturn
   */
  export type TournamentWinnerUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TournamentWinner
     */
    select?: TournamentWinnerSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TournamentWinner
     */
    omit?: TournamentWinnerOmit<ExtArgs> | null
    /**
     * The data used to update TournamentWinners.
     */
    data: XOR<TournamentWinnerUpdateManyMutationInput, TournamentWinnerUncheckedUpdateManyInput>
    /**
     * Filter which TournamentWinners to update
     */
    where?: TournamentWinnerWhereInput
    /**
     * Limit how many TournamentWinners to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TournamentWinnerIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * TournamentWinner upsert
   */
  export type TournamentWinnerUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TournamentWinner
     */
    select?: TournamentWinnerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TournamentWinner
     */
    omit?: TournamentWinnerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TournamentWinnerInclude<ExtArgs> | null
    /**
     * The filter to search for the TournamentWinner to update in case it exists.
     */
    where: TournamentWinnerWhereUniqueInput
    /**
     * In case the TournamentWinner found by the `where` argument doesn't exist, create a new TournamentWinner with this data.
     */
    create: XOR<TournamentWinnerCreateInput, TournamentWinnerUncheckedCreateInput>
    /**
     * In case the TournamentWinner was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TournamentWinnerUpdateInput, TournamentWinnerUncheckedUpdateInput>
  }

  /**
   * TournamentWinner delete
   */
  export type TournamentWinnerDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TournamentWinner
     */
    select?: TournamentWinnerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TournamentWinner
     */
    omit?: TournamentWinnerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TournamentWinnerInclude<ExtArgs> | null
    /**
     * Filter which TournamentWinner to delete.
     */
    where: TournamentWinnerWhereUniqueInput
  }

  /**
   * TournamentWinner deleteMany
   */
  export type TournamentWinnerDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TournamentWinners to delete
     */
    where?: TournamentWinnerWhereInput
    /**
     * Limit how many TournamentWinners to delete.
     */
    limit?: number
  }

  /**
   * TournamentWinner without action
   */
  export type TournamentWinnerDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TournamentWinner
     */
    select?: TournamentWinnerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TournamentWinner
     */
    omit?: TournamentWinnerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TournamentWinnerInclude<ExtArgs> | null
  }


  /**
   * Model Match
   */

  export type AggregateMatch = {
    _count: MatchCountAggregateOutputType | null
    _min: MatchMinAggregateOutputType | null
    _max: MatchMaxAggregateOutputType | null
  }

  export type MatchMinAggregateOutputType = {
    id: string | null
    matchName: string | null
    tournamentId: string | null
    createdAt: Date | null
  }

  export type MatchMaxAggregateOutputType = {
    id: string | null
    matchName: string | null
    tournamentId: string | null
    createdAt: Date | null
  }

  export type MatchCountAggregateOutputType = {
    id: number
    matchName: number
    tournamentId: number
    createdAt: number
    _all: number
  }


  export type MatchMinAggregateInputType = {
    id?: true
    matchName?: true
    tournamentId?: true
    createdAt?: true
  }

  export type MatchMaxAggregateInputType = {
    id?: true
    matchName?: true
    tournamentId?: true
    createdAt?: true
  }

  export type MatchCountAggregateInputType = {
    id?: true
    matchName?: true
    tournamentId?: true
    createdAt?: true
    _all?: true
  }

  export type MatchAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Match to aggregate.
     */
    where?: MatchWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Matches to fetch.
     */
    orderBy?: MatchOrderByWithRelationInput | MatchOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: MatchWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Matches from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Matches.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Matches
    **/
    _count?: true | MatchCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: MatchMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: MatchMaxAggregateInputType
  }

  export type GetMatchAggregateType<T extends MatchAggregateArgs> = {
        [P in keyof T & keyof AggregateMatch]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateMatch[P]>
      : GetScalarType<T[P], AggregateMatch[P]>
  }




  export type MatchGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MatchWhereInput
    orderBy?: MatchOrderByWithAggregationInput | MatchOrderByWithAggregationInput[]
    by: MatchScalarFieldEnum[] | MatchScalarFieldEnum
    having?: MatchScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: MatchCountAggregateInputType | true
    _min?: MatchMinAggregateInputType
    _max?: MatchMaxAggregateInputType
  }

  export type MatchGroupByOutputType = {
    id: string
    matchName: string
    tournamentId: string
    createdAt: Date
    _count: MatchCountAggregateOutputType | null
    _min: MatchMinAggregateOutputType | null
    _max: MatchMaxAggregateOutputType | null
  }

  type GetMatchGroupByPayload<T extends MatchGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<MatchGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof MatchGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], MatchGroupByOutputType[P]>
            : GetScalarType<T[P], MatchGroupByOutputType[P]>
        }
      >
    >


  export type MatchSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    matchName?: boolean
    tournamentId?: boolean
    createdAt?: boolean
    Tournament?: boolean | TournamentDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["match"]>

  export type MatchSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    matchName?: boolean
    tournamentId?: boolean
    createdAt?: boolean
    Tournament?: boolean | TournamentDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["match"]>

  export type MatchSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    matchName?: boolean
    tournamentId?: boolean
    createdAt?: boolean
    Tournament?: boolean | TournamentDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["match"]>

  export type MatchSelectScalar = {
    id?: boolean
    matchName?: boolean
    tournamentId?: boolean
    createdAt?: boolean
  }

  export type MatchOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "matchName" | "tournamentId" | "createdAt", ExtArgs["result"]["match"]>
  export type MatchInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    Tournament?: boolean | TournamentDefaultArgs<ExtArgs>
  }
  export type MatchIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    Tournament?: boolean | TournamentDefaultArgs<ExtArgs>
  }
  export type MatchIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    Tournament?: boolean | TournamentDefaultArgs<ExtArgs>
  }

  export type $MatchPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Match"
    objects: {
      Tournament: Prisma.$TournamentPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      matchName: string
      tournamentId: string
      createdAt: Date
    }, ExtArgs["result"]["match"]>
    composites: {}
  }

  type MatchGetPayload<S extends boolean | null | undefined | MatchDefaultArgs> = $Result.GetResult<Prisma.$MatchPayload, S>

  type MatchCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<MatchFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: MatchCountAggregateInputType | true
    }

  export interface MatchDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Match'], meta: { name: 'Match' } }
    /**
     * Find zero or one Match that matches the filter.
     * @param {MatchFindUniqueArgs} args - Arguments to find a Match
     * @example
     * // Get one Match
     * const match = await prisma.match.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends MatchFindUniqueArgs>(args: SelectSubset<T, MatchFindUniqueArgs<ExtArgs>>): Prisma__MatchClient<$Result.GetResult<Prisma.$MatchPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Match that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {MatchFindUniqueOrThrowArgs} args - Arguments to find a Match
     * @example
     * // Get one Match
     * const match = await prisma.match.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends MatchFindUniqueOrThrowArgs>(args: SelectSubset<T, MatchFindUniqueOrThrowArgs<ExtArgs>>): Prisma__MatchClient<$Result.GetResult<Prisma.$MatchPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Match that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MatchFindFirstArgs} args - Arguments to find a Match
     * @example
     * // Get one Match
     * const match = await prisma.match.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends MatchFindFirstArgs>(args?: SelectSubset<T, MatchFindFirstArgs<ExtArgs>>): Prisma__MatchClient<$Result.GetResult<Prisma.$MatchPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Match that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MatchFindFirstOrThrowArgs} args - Arguments to find a Match
     * @example
     * // Get one Match
     * const match = await prisma.match.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends MatchFindFirstOrThrowArgs>(args?: SelectSubset<T, MatchFindFirstOrThrowArgs<ExtArgs>>): Prisma__MatchClient<$Result.GetResult<Prisma.$MatchPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Matches that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MatchFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Matches
     * const matches = await prisma.match.findMany()
     * 
     * // Get first 10 Matches
     * const matches = await prisma.match.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const matchWithIdOnly = await prisma.match.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends MatchFindManyArgs>(args?: SelectSubset<T, MatchFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MatchPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Match.
     * @param {MatchCreateArgs} args - Arguments to create a Match.
     * @example
     * // Create one Match
     * const Match = await prisma.match.create({
     *   data: {
     *     // ... data to create a Match
     *   }
     * })
     * 
     */
    create<T extends MatchCreateArgs>(args: SelectSubset<T, MatchCreateArgs<ExtArgs>>): Prisma__MatchClient<$Result.GetResult<Prisma.$MatchPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Matches.
     * @param {MatchCreateManyArgs} args - Arguments to create many Matches.
     * @example
     * // Create many Matches
     * const match = await prisma.match.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends MatchCreateManyArgs>(args?: SelectSubset<T, MatchCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Matches and returns the data saved in the database.
     * @param {MatchCreateManyAndReturnArgs} args - Arguments to create many Matches.
     * @example
     * // Create many Matches
     * const match = await prisma.match.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Matches and only return the `id`
     * const matchWithIdOnly = await prisma.match.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends MatchCreateManyAndReturnArgs>(args?: SelectSubset<T, MatchCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MatchPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Match.
     * @param {MatchDeleteArgs} args - Arguments to delete one Match.
     * @example
     * // Delete one Match
     * const Match = await prisma.match.delete({
     *   where: {
     *     // ... filter to delete one Match
     *   }
     * })
     * 
     */
    delete<T extends MatchDeleteArgs>(args: SelectSubset<T, MatchDeleteArgs<ExtArgs>>): Prisma__MatchClient<$Result.GetResult<Prisma.$MatchPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Match.
     * @param {MatchUpdateArgs} args - Arguments to update one Match.
     * @example
     * // Update one Match
     * const match = await prisma.match.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends MatchUpdateArgs>(args: SelectSubset<T, MatchUpdateArgs<ExtArgs>>): Prisma__MatchClient<$Result.GetResult<Prisma.$MatchPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Matches.
     * @param {MatchDeleteManyArgs} args - Arguments to filter Matches to delete.
     * @example
     * // Delete a few Matches
     * const { count } = await prisma.match.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends MatchDeleteManyArgs>(args?: SelectSubset<T, MatchDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Matches.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MatchUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Matches
     * const match = await prisma.match.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends MatchUpdateManyArgs>(args: SelectSubset<T, MatchUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Matches and returns the data updated in the database.
     * @param {MatchUpdateManyAndReturnArgs} args - Arguments to update many Matches.
     * @example
     * // Update many Matches
     * const match = await prisma.match.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Matches and only return the `id`
     * const matchWithIdOnly = await prisma.match.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends MatchUpdateManyAndReturnArgs>(args: SelectSubset<T, MatchUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MatchPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Match.
     * @param {MatchUpsertArgs} args - Arguments to update or create a Match.
     * @example
     * // Update or create a Match
     * const match = await prisma.match.upsert({
     *   create: {
     *     // ... data to create a Match
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Match we want to update
     *   }
     * })
     */
    upsert<T extends MatchUpsertArgs>(args: SelectSubset<T, MatchUpsertArgs<ExtArgs>>): Prisma__MatchClient<$Result.GetResult<Prisma.$MatchPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Matches.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MatchCountArgs} args - Arguments to filter Matches to count.
     * @example
     * // Count the number of Matches
     * const count = await prisma.match.count({
     *   where: {
     *     // ... the filter for the Matches we want to count
     *   }
     * })
    **/
    count<T extends MatchCountArgs>(
      args?: Subset<T, MatchCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], MatchCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Match.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MatchAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends MatchAggregateArgs>(args: Subset<T, MatchAggregateArgs>): Prisma.PrismaPromise<GetMatchAggregateType<T>>

    /**
     * Group by Match.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MatchGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends MatchGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: MatchGroupByArgs['orderBy'] }
        : { orderBy?: MatchGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, MatchGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMatchGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Match model
   */
  readonly fields: MatchFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Match.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__MatchClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    Tournament<T extends TournamentDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TournamentDefaultArgs<ExtArgs>>): Prisma__TournamentClient<$Result.GetResult<Prisma.$TournamentPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Match model
   */
  interface MatchFieldRefs {
    readonly id: FieldRef<"Match", 'String'>
    readonly matchName: FieldRef<"Match", 'String'>
    readonly tournamentId: FieldRef<"Match", 'String'>
    readonly createdAt: FieldRef<"Match", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Match findUnique
   */
  export type MatchFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Match
     */
    select?: MatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Match
     */
    omit?: MatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchInclude<ExtArgs> | null
    /**
     * Filter, which Match to fetch.
     */
    where: MatchWhereUniqueInput
  }

  /**
   * Match findUniqueOrThrow
   */
  export type MatchFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Match
     */
    select?: MatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Match
     */
    omit?: MatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchInclude<ExtArgs> | null
    /**
     * Filter, which Match to fetch.
     */
    where: MatchWhereUniqueInput
  }

  /**
   * Match findFirst
   */
  export type MatchFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Match
     */
    select?: MatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Match
     */
    omit?: MatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchInclude<ExtArgs> | null
    /**
     * Filter, which Match to fetch.
     */
    where?: MatchWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Matches to fetch.
     */
    orderBy?: MatchOrderByWithRelationInput | MatchOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Matches.
     */
    cursor?: MatchWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Matches from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Matches.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Matches.
     */
    distinct?: MatchScalarFieldEnum | MatchScalarFieldEnum[]
  }

  /**
   * Match findFirstOrThrow
   */
  export type MatchFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Match
     */
    select?: MatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Match
     */
    omit?: MatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchInclude<ExtArgs> | null
    /**
     * Filter, which Match to fetch.
     */
    where?: MatchWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Matches to fetch.
     */
    orderBy?: MatchOrderByWithRelationInput | MatchOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Matches.
     */
    cursor?: MatchWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Matches from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Matches.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Matches.
     */
    distinct?: MatchScalarFieldEnum | MatchScalarFieldEnum[]
  }

  /**
   * Match findMany
   */
  export type MatchFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Match
     */
    select?: MatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Match
     */
    omit?: MatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchInclude<ExtArgs> | null
    /**
     * Filter, which Matches to fetch.
     */
    where?: MatchWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Matches to fetch.
     */
    orderBy?: MatchOrderByWithRelationInput | MatchOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Matches.
     */
    cursor?: MatchWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Matches from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Matches.
     */
    skip?: number
    distinct?: MatchScalarFieldEnum | MatchScalarFieldEnum[]
  }

  /**
   * Match create
   */
  export type MatchCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Match
     */
    select?: MatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Match
     */
    omit?: MatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchInclude<ExtArgs> | null
    /**
     * The data needed to create a Match.
     */
    data: XOR<MatchCreateInput, MatchUncheckedCreateInput>
  }

  /**
   * Match createMany
   */
  export type MatchCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Matches.
     */
    data: MatchCreateManyInput | MatchCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Match createManyAndReturn
   */
  export type MatchCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Match
     */
    select?: MatchSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Match
     */
    omit?: MatchOmit<ExtArgs> | null
    /**
     * The data used to create many Matches.
     */
    data: MatchCreateManyInput | MatchCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Match update
   */
  export type MatchUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Match
     */
    select?: MatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Match
     */
    omit?: MatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchInclude<ExtArgs> | null
    /**
     * The data needed to update a Match.
     */
    data: XOR<MatchUpdateInput, MatchUncheckedUpdateInput>
    /**
     * Choose, which Match to update.
     */
    where: MatchWhereUniqueInput
  }

  /**
   * Match updateMany
   */
  export type MatchUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Matches.
     */
    data: XOR<MatchUpdateManyMutationInput, MatchUncheckedUpdateManyInput>
    /**
     * Filter which Matches to update
     */
    where?: MatchWhereInput
    /**
     * Limit how many Matches to update.
     */
    limit?: number
  }

  /**
   * Match updateManyAndReturn
   */
  export type MatchUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Match
     */
    select?: MatchSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Match
     */
    omit?: MatchOmit<ExtArgs> | null
    /**
     * The data used to update Matches.
     */
    data: XOR<MatchUpdateManyMutationInput, MatchUncheckedUpdateManyInput>
    /**
     * Filter which Matches to update
     */
    where?: MatchWhereInput
    /**
     * Limit how many Matches to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Match upsert
   */
  export type MatchUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Match
     */
    select?: MatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Match
     */
    omit?: MatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchInclude<ExtArgs> | null
    /**
     * The filter to search for the Match to update in case it exists.
     */
    where: MatchWhereUniqueInput
    /**
     * In case the Match found by the `where` argument doesn't exist, create a new Match with this data.
     */
    create: XOR<MatchCreateInput, MatchUncheckedCreateInput>
    /**
     * In case the Match was found with the provided `where` argument, update it with this data.
     */
    update: XOR<MatchUpdateInput, MatchUncheckedUpdateInput>
  }

  /**
   * Match delete
   */
  export type MatchDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Match
     */
    select?: MatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Match
     */
    omit?: MatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchInclude<ExtArgs> | null
    /**
     * Filter which Match to delete.
     */
    where: MatchWhereUniqueInput
  }

  /**
   * Match deleteMany
   */
  export type MatchDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Matches to delete
     */
    where?: MatchWhereInput
    /**
     * Limit how many Matches to delete.
     */
    limit?: number
  }

  /**
   * Match without action
   */
  export type MatchDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Match
     */
    select?: MatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Match
     */
    omit?: MatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchInclude<ExtArgs> | null
  }


  /**
   * Model Wallet
   */

  export type AggregateWallet = {
    _count: WalletCountAggregateOutputType | null
    _avg: WalletAvgAggregateOutputType | null
    _sum: WalletSumAggregateOutputType | null
    _min: WalletMinAggregateOutputType | null
    _max: WalletMaxAggregateOutputType | null
  }

  export type WalletAvgAggregateOutputType = {
    amount: number | null
  }

  export type WalletSumAggregateOutputType = {
    amount: number | null
  }

  export type WalletMinAggregateOutputType = {
    id: string | null
    amount: number | null
    createdAt: Date | null
    playerId: string | null
    userId: string | null
  }

  export type WalletMaxAggregateOutputType = {
    id: string | null
    amount: number | null
    createdAt: Date | null
    playerId: string | null
    userId: string | null
  }

  export type WalletCountAggregateOutputType = {
    id: number
    amount: number
    createdAt: number
    playerId: number
    userId: number
    _all: number
  }


  export type WalletAvgAggregateInputType = {
    amount?: true
  }

  export type WalletSumAggregateInputType = {
    amount?: true
  }

  export type WalletMinAggregateInputType = {
    id?: true
    amount?: true
    createdAt?: true
    playerId?: true
    userId?: true
  }

  export type WalletMaxAggregateInputType = {
    id?: true
    amount?: true
    createdAt?: true
    playerId?: true
    userId?: true
  }

  export type WalletCountAggregateInputType = {
    id?: true
    amount?: true
    createdAt?: true
    playerId?: true
    userId?: true
    _all?: true
  }

  export type WalletAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Wallet to aggregate.
     */
    where?: WalletWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Wallets to fetch.
     */
    orderBy?: WalletOrderByWithRelationInput | WalletOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: WalletWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Wallets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Wallets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Wallets
    **/
    _count?: true | WalletCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: WalletAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: WalletSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: WalletMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: WalletMaxAggregateInputType
  }

  export type GetWalletAggregateType<T extends WalletAggregateArgs> = {
        [P in keyof T & keyof AggregateWallet]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateWallet[P]>
      : GetScalarType<T[P], AggregateWallet[P]>
  }




  export type WalletGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WalletWhereInput
    orderBy?: WalletOrderByWithAggregationInput | WalletOrderByWithAggregationInput[]
    by: WalletScalarFieldEnum[] | WalletScalarFieldEnum
    having?: WalletScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: WalletCountAggregateInputType | true
    _avg?: WalletAvgAggregateInputType
    _sum?: WalletSumAggregateInputType
    _min?: WalletMinAggregateInputType
    _max?: WalletMaxAggregateInputType
  }

  export type WalletGroupByOutputType = {
    id: string
    amount: number
    createdAt: Date
    playerId: string | null
    userId: string
    _count: WalletCountAggregateOutputType | null
    _avg: WalletAvgAggregateOutputType | null
    _sum: WalletSumAggregateOutputType | null
    _min: WalletMinAggregateOutputType | null
    _max: WalletMaxAggregateOutputType | null
  }

  type GetWalletGroupByPayload<T extends WalletGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<WalletGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof WalletGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], WalletGroupByOutputType[P]>
            : GetScalarType<T[P], WalletGroupByOutputType[P]>
        }
      >
    >


  export type WalletSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    amount?: boolean
    createdAt?: boolean
    playerId?: boolean
    userId?: boolean
    player?: boolean | Wallet$playerArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["wallet"]>

  export type WalletSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    amount?: boolean
    createdAt?: boolean
    playerId?: boolean
    userId?: boolean
    player?: boolean | Wallet$playerArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["wallet"]>

  export type WalletSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    amount?: boolean
    createdAt?: boolean
    playerId?: boolean
    userId?: boolean
    player?: boolean | Wallet$playerArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["wallet"]>

  export type WalletSelectScalar = {
    id?: boolean
    amount?: boolean
    createdAt?: boolean
    playerId?: boolean
    userId?: boolean
  }

  export type WalletOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "amount" | "createdAt" | "playerId" | "userId", ExtArgs["result"]["wallet"]>
  export type WalletInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    player?: boolean | Wallet$playerArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type WalletIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    player?: boolean | Wallet$playerArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type WalletIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    player?: boolean | Wallet$playerArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $WalletPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Wallet"
    objects: {
      player: Prisma.$PlayerPayload<ExtArgs> | null
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      amount: number
      createdAt: Date
      playerId: string | null
      userId: string
    }, ExtArgs["result"]["wallet"]>
    composites: {}
  }

  type WalletGetPayload<S extends boolean | null | undefined | WalletDefaultArgs> = $Result.GetResult<Prisma.$WalletPayload, S>

  type WalletCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<WalletFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: WalletCountAggregateInputType | true
    }

  export interface WalletDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Wallet'], meta: { name: 'Wallet' } }
    /**
     * Find zero or one Wallet that matches the filter.
     * @param {WalletFindUniqueArgs} args - Arguments to find a Wallet
     * @example
     * // Get one Wallet
     * const wallet = await prisma.wallet.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends WalletFindUniqueArgs>(args: SelectSubset<T, WalletFindUniqueArgs<ExtArgs>>): Prisma__WalletClient<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Wallet that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {WalletFindUniqueOrThrowArgs} args - Arguments to find a Wallet
     * @example
     * // Get one Wallet
     * const wallet = await prisma.wallet.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends WalletFindUniqueOrThrowArgs>(args: SelectSubset<T, WalletFindUniqueOrThrowArgs<ExtArgs>>): Prisma__WalletClient<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Wallet that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WalletFindFirstArgs} args - Arguments to find a Wallet
     * @example
     * // Get one Wallet
     * const wallet = await prisma.wallet.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends WalletFindFirstArgs>(args?: SelectSubset<T, WalletFindFirstArgs<ExtArgs>>): Prisma__WalletClient<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Wallet that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WalletFindFirstOrThrowArgs} args - Arguments to find a Wallet
     * @example
     * // Get one Wallet
     * const wallet = await prisma.wallet.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends WalletFindFirstOrThrowArgs>(args?: SelectSubset<T, WalletFindFirstOrThrowArgs<ExtArgs>>): Prisma__WalletClient<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Wallets that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WalletFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Wallets
     * const wallets = await prisma.wallet.findMany()
     * 
     * // Get first 10 Wallets
     * const wallets = await prisma.wallet.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const walletWithIdOnly = await prisma.wallet.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends WalletFindManyArgs>(args?: SelectSubset<T, WalletFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Wallet.
     * @param {WalletCreateArgs} args - Arguments to create a Wallet.
     * @example
     * // Create one Wallet
     * const Wallet = await prisma.wallet.create({
     *   data: {
     *     // ... data to create a Wallet
     *   }
     * })
     * 
     */
    create<T extends WalletCreateArgs>(args: SelectSubset<T, WalletCreateArgs<ExtArgs>>): Prisma__WalletClient<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Wallets.
     * @param {WalletCreateManyArgs} args - Arguments to create many Wallets.
     * @example
     * // Create many Wallets
     * const wallet = await prisma.wallet.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends WalletCreateManyArgs>(args?: SelectSubset<T, WalletCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Wallets and returns the data saved in the database.
     * @param {WalletCreateManyAndReturnArgs} args - Arguments to create many Wallets.
     * @example
     * // Create many Wallets
     * const wallet = await prisma.wallet.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Wallets and only return the `id`
     * const walletWithIdOnly = await prisma.wallet.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends WalletCreateManyAndReturnArgs>(args?: SelectSubset<T, WalletCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Wallet.
     * @param {WalletDeleteArgs} args - Arguments to delete one Wallet.
     * @example
     * // Delete one Wallet
     * const Wallet = await prisma.wallet.delete({
     *   where: {
     *     // ... filter to delete one Wallet
     *   }
     * })
     * 
     */
    delete<T extends WalletDeleteArgs>(args: SelectSubset<T, WalletDeleteArgs<ExtArgs>>): Prisma__WalletClient<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Wallet.
     * @param {WalletUpdateArgs} args - Arguments to update one Wallet.
     * @example
     * // Update one Wallet
     * const wallet = await prisma.wallet.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends WalletUpdateArgs>(args: SelectSubset<T, WalletUpdateArgs<ExtArgs>>): Prisma__WalletClient<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Wallets.
     * @param {WalletDeleteManyArgs} args - Arguments to filter Wallets to delete.
     * @example
     * // Delete a few Wallets
     * const { count } = await prisma.wallet.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends WalletDeleteManyArgs>(args?: SelectSubset<T, WalletDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Wallets.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WalletUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Wallets
     * const wallet = await prisma.wallet.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends WalletUpdateManyArgs>(args: SelectSubset<T, WalletUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Wallets and returns the data updated in the database.
     * @param {WalletUpdateManyAndReturnArgs} args - Arguments to update many Wallets.
     * @example
     * // Update many Wallets
     * const wallet = await prisma.wallet.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Wallets and only return the `id`
     * const walletWithIdOnly = await prisma.wallet.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends WalletUpdateManyAndReturnArgs>(args: SelectSubset<T, WalletUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Wallet.
     * @param {WalletUpsertArgs} args - Arguments to update or create a Wallet.
     * @example
     * // Update or create a Wallet
     * const wallet = await prisma.wallet.upsert({
     *   create: {
     *     // ... data to create a Wallet
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Wallet we want to update
     *   }
     * })
     */
    upsert<T extends WalletUpsertArgs>(args: SelectSubset<T, WalletUpsertArgs<ExtArgs>>): Prisma__WalletClient<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Wallets.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WalletCountArgs} args - Arguments to filter Wallets to count.
     * @example
     * // Count the number of Wallets
     * const count = await prisma.wallet.count({
     *   where: {
     *     // ... the filter for the Wallets we want to count
     *   }
     * })
    **/
    count<T extends WalletCountArgs>(
      args?: Subset<T, WalletCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], WalletCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Wallet.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WalletAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends WalletAggregateArgs>(args: Subset<T, WalletAggregateArgs>): Prisma.PrismaPromise<GetWalletAggregateType<T>>

    /**
     * Group by Wallet.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WalletGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends WalletGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: WalletGroupByArgs['orderBy'] }
        : { orderBy?: WalletGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, WalletGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWalletGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Wallet model
   */
  readonly fields: WalletFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Wallet.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__WalletClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    player<T extends Wallet$playerArgs<ExtArgs> = {}>(args?: Subset<T, Wallet$playerArgs<ExtArgs>>): Prisma__PlayerClient<$Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Wallet model
   */
  interface WalletFieldRefs {
    readonly id: FieldRef<"Wallet", 'String'>
    readonly amount: FieldRef<"Wallet", 'Int'>
    readonly createdAt: FieldRef<"Wallet", 'DateTime'>
    readonly playerId: FieldRef<"Wallet", 'String'>
    readonly userId: FieldRef<"Wallet", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Wallet findUnique
   */
  export type WalletFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Wallet
     */
    omit?: WalletOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletInclude<ExtArgs> | null
    /**
     * Filter, which Wallet to fetch.
     */
    where: WalletWhereUniqueInput
  }

  /**
   * Wallet findUniqueOrThrow
   */
  export type WalletFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Wallet
     */
    omit?: WalletOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletInclude<ExtArgs> | null
    /**
     * Filter, which Wallet to fetch.
     */
    where: WalletWhereUniqueInput
  }

  /**
   * Wallet findFirst
   */
  export type WalletFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Wallet
     */
    omit?: WalletOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletInclude<ExtArgs> | null
    /**
     * Filter, which Wallet to fetch.
     */
    where?: WalletWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Wallets to fetch.
     */
    orderBy?: WalletOrderByWithRelationInput | WalletOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Wallets.
     */
    cursor?: WalletWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Wallets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Wallets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Wallets.
     */
    distinct?: WalletScalarFieldEnum | WalletScalarFieldEnum[]
  }

  /**
   * Wallet findFirstOrThrow
   */
  export type WalletFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Wallet
     */
    omit?: WalletOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletInclude<ExtArgs> | null
    /**
     * Filter, which Wallet to fetch.
     */
    where?: WalletWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Wallets to fetch.
     */
    orderBy?: WalletOrderByWithRelationInput | WalletOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Wallets.
     */
    cursor?: WalletWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Wallets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Wallets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Wallets.
     */
    distinct?: WalletScalarFieldEnum | WalletScalarFieldEnum[]
  }

  /**
   * Wallet findMany
   */
  export type WalletFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Wallet
     */
    omit?: WalletOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletInclude<ExtArgs> | null
    /**
     * Filter, which Wallets to fetch.
     */
    where?: WalletWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Wallets to fetch.
     */
    orderBy?: WalletOrderByWithRelationInput | WalletOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Wallets.
     */
    cursor?: WalletWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Wallets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Wallets.
     */
    skip?: number
    distinct?: WalletScalarFieldEnum | WalletScalarFieldEnum[]
  }

  /**
   * Wallet create
   */
  export type WalletCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Wallet
     */
    omit?: WalletOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletInclude<ExtArgs> | null
    /**
     * The data needed to create a Wallet.
     */
    data: XOR<WalletCreateInput, WalletUncheckedCreateInput>
  }

  /**
   * Wallet createMany
   */
  export type WalletCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Wallets.
     */
    data: WalletCreateManyInput | WalletCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Wallet createManyAndReturn
   */
  export type WalletCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Wallet
     */
    omit?: WalletOmit<ExtArgs> | null
    /**
     * The data used to create many Wallets.
     */
    data: WalletCreateManyInput | WalletCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Wallet update
   */
  export type WalletUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Wallet
     */
    omit?: WalletOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletInclude<ExtArgs> | null
    /**
     * The data needed to update a Wallet.
     */
    data: XOR<WalletUpdateInput, WalletUncheckedUpdateInput>
    /**
     * Choose, which Wallet to update.
     */
    where: WalletWhereUniqueInput
  }

  /**
   * Wallet updateMany
   */
  export type WalletUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Wallets.
     */
    data: XOR<WalletUpdateManyMutationInput, WalletUncheckedUpdateManyInput>
    /**
     * Filter which Wallets to update
     */
    where?: WalletWhereInput
    /**
     * Limit how many Wallets to update.
     */
    limit?: number
  }

  /**
   * Wallet updateManyAndReturn
   */
  export type WalletUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Wallet
     */
    omit?: WalletOmit<ExtArgs> | null
    /**
     * The data used to update Wallets.
     */
    data: XOR<WalletUpdateManyMutationInput, WalletUncheckedUpdateManyInput>
    /**
     * Filter which Wallets to update
     */
    where?: WalletWhereInput
    /**
     * Limit how many Wallets to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Wallet upsert
   */
  export type WalletUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Wallet
     */
    omit?: WalletOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletInclude<ExtArgs> | null
    /**
     * The filter to search for the Wallet to update in case it exists.
     */
    where: WalletWhereUniqueInput
    /**
     * In case the Wallet found by the `where` argument doesn't exist, create a new Wallet with this data.
     */
    create: XOR<WalletCreateInput, WalletUncheckedCreateInput>
    /**
     * In case the Wallet was found with the provided `where` argument, update it with this data.
     */
    update: XOR<WalletUpdateInput, WalletUncheckedUpdateInput>
  }

  /**
   * Wallet delete
   */
  export type WalletDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Wallet
     */
    omit?: WalletOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletInclude<ExtArgs> | null
    /**
     * Filter which Wallet to delete.
     */
    where: WalletWhereUniqueInput
  }

  /**
   * Wallet deleteMany
   */
  export type WalletDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Wallets to delete
     */
    where?: WalletWhereInput
    /**
     * Limit how many Wallets to delete.
     */
    limit?: number
  }

  /**
   * Wallet.player
   */
  export type Wallet$playerArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Player
     */
    select?: PlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Player
     */
    omit?: PlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerInclude<ExtArgs> | null
    where?: PlayerWhereInput
  }

  /**
   * Wallet without action
   */
  export type WalletDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Wallet
     */
    omit?: WalletOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletInclude<ExtArgs> | null
  }


  /**
   * Model PlayerStats
   */

  export type AggregatePlayerStats = {
    _count: PlayerStatsCountAggregateOutputType | null
    _avg: PlayerStatsAvgAggregateOutputType | null
    _sum: PlayerStatsSumAggregateOutputType | null
    _min: PlayerStatsMinAggregateOutputType | null
    _max: PlayerStatsMaxAggregateOutputType | null
  }

  export type PlayerStatsAvgAggregateOutputType = {
    matches: number | null
    wins: number | null
    deaths: number | null
    kills: number | null
    kd: number | null
  }

  export type PlayerStatsSumAggregateOutputType = {
    matches: number | null
    wins: number | null
    deaths: number | null
    kills: number | null
    kd: number | null
  }

  export type PlayerStatsMinAggregateOutputType = {
    id: string | null
    playerId: string | null
    matches: number | null
    wins: number | null
    deaths: number | null
    kills: number | null
    kd: number | null
    createdAt: Date | null
  }

  export type PlayerStatsMaxAggregateOutputType = {
    id: string | null
    playerId: string | null
    matches: number | null
    wins: number | null
    deaths: number | null
    kills: number | null
    kd: number | null
    createdAt: Date | null
  }

  export type PlayerStatsCountAggregateOutputType = {
    id: number
    playerId: number
    matches: number
    wins: number
    deaths: number
    kills: number
    kd: number
    createdAt: number
    _all: number
  }


  export type PlayerStatsAvgAggregateInputType = {
    matches?: true
    wins?: true
    deaths?: true
    kills?: true
    kd?: true
  }

  export type PlayerStatsSumAggregateInputType = {
    matches?: true
    wins?: true
    deaths?: true
    kills?: true
    kd?: true
  }

  export type PlayerStatsMinAggregateInputType = {
    id?: true
    playerId?: true
    matches?: true
    wins?: true
    deaths?: true
    kills?: true
    kd?: true
    createdAt?: true
  }

  export type PlayerStatsMaxAggregateInputType = {
    id?: true
    playerId?: true
    matches?: true
    wins?: true
    deaths?: true
    kills?: true
    kd?: true
    createdAt?: true
  }

  export type PlayerStatsCountAggregateInputType = {
    id?: true
    playerId?: true
    matches?: true
    wins?: true
    deaths?: true
    kills?: true
    kd?: true
    createdAt?: true
    _all?: true
  }

  export type PlayerStatsAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PlayerStats to aggregate.
     */
    where?: PlayerStatsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PlayerStats to fetch.
     */
    orderBy?: PlayerStatsOrderByWithRelationInput | PlayerStatsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PlayerStatsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PlayerStats from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PlayerStats.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PlayerStats
    **/
    _count?: true | PlayerStatsCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PlayerStatsAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PlayerStatsSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PlayerStatsMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PlayerStatsMaxAggregateInputType
  }

  export type GetPlayerStatsAggregateType<T extends PlayerStatsAggregateArgs> = {
        [P in keyof T & keyof AggregatePlayerStats]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePlayerStats[P]>
      : GetScalarType<T[P], AggregatePlayerStats[P]>
  }




  export type PlayerStatsGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PlayerStatsWhereInput
    orderBy?: PlayerStatsOrderByWithAggregationInput | PlayerStatsOrderByWithAggregationInput[]
    by: PlayerStatsScalarFieldEnum[] | PlayerStatsScalarFieldEnum
    having?: PlayerStatsScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PlayerStatsCountAggregateInputType | true
    _avg?: PlayerStatsAvgAggregateInputType
    _sum?: PlayerStatsSumAggregateInputType
    _min?: PlayerStatsMinAggregateInputType
    _max?: PlayerStatsMaxAggregateInputType
  }

  export type PlayerStatsGroupByOutputType = {
    id: string
    playerId: string
    matches: number
    wins: number
    deaths: number
    kills: number
    kd: number
    createdAt: Date
    _count: PlayerStatsCountAggregateOutputType | null
    _avg: PlayerStatsAvgAggregateOutputType | null
    _sum: PlayerStatsSumAggregateOutputType | null
    _min: PlayerStatsMinAggregateOutputType | null
    _max: PlayerStatsMaxAggregateOutputType | null
  }

  type GetPlayerStatsGroupByPayload<T extends PlayerStatsGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PlayerStatsGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PlayerStatsGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PlayerStatsGroupByOutputType[P]>
            : GetScalarType<T[P], PlayerStatsGroupByOutputType[P]>
        }
      >
    >


  export type PlayerStatsSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    playerId?: boolean
    matches?: boolean
    wins?: boolean
    deaths?: boolean
    kills?: boolean
    kd?: boolean
    createdAt?: boolean
    player?: boolean | PlayerDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["playerStats"]>

  export type PlayerStatsSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    playerId?: boolean
    matches?: boolean
    wins?: boolean
    deaths?: boolean
    kills?: boolean
    kd?: boolean
    createdAt?: boolean
    player?: boolean | PlayerDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["playerStats"]>

  export type PlayerStatsSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    playerId?: boolean
    matches?: boolean
    wins?: boolean
    deaths?: boolean
    kills?: boolean
    kd?: boolean
    createdAt?: boolean
    player?: boolean | PlayerDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["playerStats"]>

  export type PlayerStatsSelectScalar = {
    id?: boolean
    playerId?: boolean
    matches?: boolean
    wins?: boolean
    deaths?: boolean
    kills?: boolean
    kd?: boolean
    createdAt?: boolean
  }

  export type PlayerStatsOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "playerId" | "matches" | "wins" | "deaths" | "kills" | "kd" | "createdAt", ExtArgs["result"]["playerStats"]>
  export type PlayerStatsInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    player?: boolean | PlayerDefaultArgs<ExtArgs>
  }
  export type PlayerStatsIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    player?: boolean | PlayerDefaultArgs<ExtArgs>
  }
  export type PlayerStatsIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    player?: boolean | PlayerDefaultArgs<ExtArgs>
  }

  export type $PlayerStatsPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PlayerStats"
    objects: {
      player: Prisma.$PlayerPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      playerId: string
      matches: number
      wins: number
      deaths: number
      kills: number
      kd: number
      createdAt: Date
    }, ExtArgs["result"]["playerStats"]>
    composites: {}
  }

  type PlayerStatsGetPayload<S extends boolean | null | undefined | PlayerStatsDefaultArgs> = $Result.GetResult<Prisma.$PlayerStatsPayload, S>

  type PlayerStatsCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PlayerStatsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PlayerStatsCountAggregateInputType | true
    }

  export interface PlayerStatsDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PlayerStats'], meta: { name: 'PlayerStats' } }
    /**
     * Find zero or one PlayerStats that matches the filter.
     * @param {PlayerStatsFindUniqueArgs} args - Arguments to find a PlayerStats
     * @example
     * // Get one PlayerStats
     * const playerStats = await prisma.playerStats.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PlayerStatsFindUniqueArgs>(args: SelectSubset<T, PlayerStatsFindUniqueArgs<ExtArgs>>): Prisma__PlayerStatsClient<$Result.GetResult<Prisma.$PlayerStatsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one PlayerStats that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PlayerStatsFindUniqueOrThrowArgs} args - Arguments to find a PlayerStats
     * @example
     * // Get one PlayerStats
     * const playerStats = await prisma.playerStats.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PlayerStatsFindUniqueOrThrowArgs>(args: SelectSubset<T, PlayerStatsFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PlayerStatsClient<$Result.GetResult<Prisma.$PlayerStatsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PlayerStats that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlayerStatsFindFirstArgs} args - Arguments to find a PlayerStats
     * @example
     * // Get one PlayerStats
     * const playerStats = await prisma.playerStats.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PlayerStatsFindFirstArgs>(args?: SelectSubset<T, PlayerStatsFindFirstArgs<ExtArgs>>): Prisma__PlayerStatsClient<$Result.GetResult<Prisma.$PlayerStatsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PlayerStats that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlayerStatsFindFirstOrThrowArgs} args - Arguments to find a PlayerStats
     * @example
     * // Get one PlayerStats
     * const playerStats = await prisma.playerStats.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PlayerStatsFindFirstOrThrowArgs>(args?: SelectSubset<T, PlayerStatsFindFirstOrThrowArgs<ExtArgs>>): Prisma__PlayerStatsClient<$Result.GetResult<Prisma.$PlayerStatsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more PlayerStats that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlayerStatsFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PlayerStats
     * const playerStats = await prisma.playerStats.findMany()
     * 
     * // Get first 10 PlayerStats
     * const playerStats = await prisma.playerStats.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const playerStatsWithIdOnly = await prisma.playerStats.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PlayerStatsFindManyArgs>(args?: SelectSubset<T, PlayerStatsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PlayerStatsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a PlayerStats.
     * @param {PlayerStatsCreateArgs} args - Arguments to create a PlayerStats.
     * @example
     * // Create one PlayerStats
     * const PlayerStats = await prisma.playerStats.create({
     *   data: {
     *     // ... data to create a PlayerStats
     *   }
     * })
     * 
     */
    create<T extends PlayerStatsCreateArgs>(args: SelectSubset<T, PlayerStatsCreateArgs<ExtArgs>>): Prisma__PlayerStatsClient<$Result.GetResult<Prisma.$PlayerStatsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many PlayerStats.
     * @param {PlayerStatsCreateManyArgs} args - Arguments to create many PlayerStats.
     * @example
     * // Create many PlayerStats
     * const playerStats = await prisma.playerStats.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PlayerStatsCreateManyArgs>(args?: SelectSubset<T, PlayerStatsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PlayerStats and returns the data saved in the database.
     * @param {PlayerStatsCreateManyAndReturnArgs} args - Arguments to create many PlayerStats.
     * @example
     * // Create many PlayerStats
     * const playerStats = await prisma.playerStats.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PlayerStats and only return the `id`
     * const playerStatsWithIdOnly = await prisma.playerStats.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PlayerStatsCreateManyAndReturnArgs>(args?: SelectSubset<T, PlayerStatsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PlayerStatsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a PlayerStats.
     * @param {PlayerStatsDeleteArgs} args - Arguments to delete one PlayerStats.
     * @example
     * // Delete one PlayerStats
     * const PlayerStats = await prisma.playerStats.delete({
     *   where: {
     *     // ... filter to delete one PlayerStats
     *   }
     * })
     * 
     */
    delete<T extends PlayerStatsDeleteArgs>(args: SelectSubset<T, PlayerStatsDeleteArgs<ExtArgs>>): Prisma__PlayerStatsClient<$Result.GetResult<Prisma.$PlayerStatsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one PlayerStats.
     * @param {PlayerStatsUpdateArgs} args - Arguments to update one PlayerStats.
     * @example
     * // Update one PlayerStats
     * const playerStats = await prisma.playerStats.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PlayerStatsUpdateArgs>(args: SelectSubset<T, PlayerStatsUpdateArgs<ExtArgs>>): Prisma__PlayerStatsClient<$Result.GetResult<Prisma.$PlayerStatsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more PlayerStats.
     * @param {PlayerStatsDeleteManyArgs} args - Arguments to filter PlayerStats to delete.
     * @example
     * // Delete a few PlayerStats
     * const { count } = await prisma.playerStats.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PlayerStatsDeleteManyArgs>(args?: SelectSubset<T, PlayerStatsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PlayerStats.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlayerStatsUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PlayerStats
     * const playerStats = await prisma.playerStats.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PlayerStatsUpdateManyArgs>(args: SelectSubset<T, PlayerStatsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PlayerStats and returns the data updated in the database.
     * @param {PlayerStatsUpdateManyAndReturnArgs} args - Arguments to update many PlayerStats.
     * @example
     * // Update many PlayerStats
     * const playerStats = await prisma.playerStats.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more PlayerStats and only return the `id`
     * const playerStatsWithIdOnly = await prisma.playerStats.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PlayerStatsUpdateManyAndReturnArgs>(args: SelectSubset<T, PlayerStatsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PlayerStatsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one PlayerStats.
     * @param {PlayerStatsUpsertArgs} args - Arguments to update or create a PlayerStats.
     * @example
     * // Update or create a PlayerStats
     * const playerStats = await prisma.playerStats.upsert({
     *   create: {
     *     // ... data to create a PlayerStats
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PlayerStats we want to update
     *   }
     * })
     */
    upsert<T extends PlayerStatsUpsertArgs>(args: SelectSubset<T, PlayerStatsUpsertArgs<ExtArgs>>): Prisma__PlayerStatsClient<$Result.GetResult<Prisma.$PlayerStatsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of PlayerStats.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlayerStatsCountArgs} args - Arguments to filter PlayerStats to count.
     * @example
     * // Count the number of PlayerStats
     * const count = await prisma.playerStats.count({
     *   where: {
     *     // ... the filter for the PlayerStats we want to count
     *   }
     * })
    **/
    count<T extends PlayerStatsCountArgs>(
      args?: Subset<T, PlayerStatsCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PlayerStatsCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PlayerStats.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlayerStatsAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PlayerStatsAggregateArgs>(args: Subset<T, PlayerStatsAggregateArgs>): Prisma.PrismaPromise<GetPlayerStatsAggregateType<T>>

    /**
     * Group by PlayerStats.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlayerStatsGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PlayerStatsGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PlayerStatsGroupByArgs['orderBy'] }
        : { orderBy?: PlayerStatsGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PlayerStatsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPlayerStatsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PlayerStats model
   */
  readonly fields: PlayerStatsFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PlayerStats.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PlayerStatsClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    player<T extends PlayerDefaultArgs<ExtArgs> = {}>(args?: Subset<T, PlayerDefaultArgs<ExtArgs>>): Prisma__PlayerClient<$Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the PlayerStats model
   */
  interface PlayerStatsFieldRefs {
    readonly id: FieldRef<"PlayerStats", 'String'>
    readonly playerId: FieldRef<"PlayerStats", 'String'>
    readonly matches: FieldRef<"PlayerStats", 'Int'>
    readonly wins: FieldRef<"PlayerStats", 'Int'>
    readonly deaths: FieldRef<"PlayerStats", 'Int'>
    readonly kills: FieldRef<"PlayerStats", 'Int'>
    readonly kd: FieldRef<"PlayerStats", 'Float'>
    readonly createdAt: FieldRef<"PlayerStats", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * PlayerStats findUnique
   */
  export type PlayerStatsFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlayerStats
     */
    select?: PlayerStatsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PlayerStats
     */
    omit?: PlayerStatsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerStatsInclude<ExtArgs> | null
    /**
     * Filter, which PlayerStats to fetch.
     */
    where: PlayerStatsWhereUniqueInput
  }

  /**
   * PlayerStats findUniqueOrThrow
   */
  export type PlayerStatsFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlayerStats
     */
    select?: PlayerStatsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PlayerStats
     */
    omit?: PlayerStatsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerStatsInclude<ExtArgs> | null
    /**
     * Filter, which PlayerStats to fetch.
     */
    where: PlayerStatsWhereUniqueInput
  }

  /**
   * PlayerStats findFirst
   */
  export type PlayerStatsFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlayerStats
     */
    select?: PlayerStatsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PlayerStats
     */
    omit?: PlayerStatsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerStatsInclude<ExtArgs> | null
    /**
     * Filter, which PlayerStats to fetch.
     */
    where?: PlayerStatsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PlayerStats to fetch.
     */
    orderBy?: PlayerStatsOrderByWithRelationInput | PlayerStatsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PlayerStats.
     */
    cursor?: PlayerStatsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PlayerStats from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PlayerStats.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PlayerStats.
     */
    distinct?: PlayerStatsScalarFieldEnum | PlayerStatsScalarFieldEnum[]
  }

  /**
   * PlayerStats findFirstOrThrow
   */
  export type PlayerStatsFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlayerStats
     */
    select?: PlayerStatsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PlayerStats
     */
    omit?: PlayerStatsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerStatsInclude<ExtArgs> | null
    /**
     * Filter, which PlayerStats to fetch.
     */
    where?: PlayerStatsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PlayerStats to fetch.
     */
    orderBy?: PlayerStatsOrderByWithRelationInput | PlayerStatsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PlayerStats.
     */
    cursor?: PlayerStatsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PlayerStats from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PlayerStats.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PlayerStats.
     */
    distinct?: PlayerStatsScalarFieldEnum | PlayerStatsScalarFieldEnum[]
  }

  /**
   * PlayerStats findMany
   */
  export type PlayerStatsFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlayerStats
     */
    select?: PlayerStatsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PlayerStats
     */
    omit?: PlayerStatsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerStatsInclude<ExtArgs> | null
    /**
     * Filter, which PlayerStats to fetch.
     */
    where?: PlayerStatsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PlayerStats to fetch.
     */
    orderBy?: PlayerStatsOrderByWithRelationInput | PlayerStatsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PlayerStats.
     */
    cursor?: PlayerStatsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PlayerStats from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PlayerStats.
     */
    skip?: number
    distinct?: PlayerStatsScalarFieldEnum | PlayerStatsScalarFieldEnum[]
  }

  /**
   * PlayerStats create
   */
  export type PlayerStatsCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlayerStats
     */
    select?: PlayerStatsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PlayerStats
     */
    omit?: PlayerStatsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerStatsInclude<ExtArgs> | null
    /**
     * The data needed to create a PlayerStats.
     */
    data: XOR<PlayerStatsCreateInput, PlayerStatsUncheckedCreateInput>
  }

  /**
   * PlayerStats createMany
   */
  export type PlayerStatsCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PlayerStats.
     */
    data: PlayerStatsCreateManyInput | PlayerStatsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PlayerStats createManyAndReturn
   */
  export type PlayerStatsCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlayerStats
     */
    select?: PlayerStatsSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PlayerStats
     */
    omit?: PlayerStatsOmit<ExtArgs> | null
    /**
     * The data used to create many PlayerStats.
     */
    data: PlayerStatsCreateManyInput | PlayerStatsCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerStatsIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * PlayerStats update
   */
  export type PlayerStatsUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlayerStats
     */
    select?: PlayerStatsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PlayerStats
     */
    omit?: PlayerStatsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerStatsInclude<ExtArgs> | null
    /**
     * The data needed to update a PlayerStats.
     */
    data: XOR<PlayerStatsUpdateInput, PlayerStatsUncheckedUpdateInput>
    /**
     * Choose, which PlayerStats to update.
     */
    where: PlayerStatsWhereUniqueInput
  }

  /**
   * PlayerStats updateMany
   */
  export type PlayerStatsUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PlayerStats.
     */
    data: XOR<PlayerStatsUpdateManyMutationInput, PlayerStatsUncheckedUpdateManyInput>
    /**
     * Filter which PlayerStats to update
     */
    where?: PlayerStatsWhereInput
    /**
     * Limit how many PlayerStats to update.
     */
    limit?: number
  }

  /**
   * PlayerStats updateManyAndReturn
   */
  export type PlayerStatsUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlayerStats
     */
    select?: PlayerStatsSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PlayerStats
     */
    omit?: PlayerStatsOmit<ExtArgs> | null
    /**
     * The data used to update PlayerStats.
     */
    data: XOR<PlayerStatsUpdateManyMutationInput, PlayerStatsUncheckedUpdateManyInput>
    /**
     * Filter which PlayerStats to update
     */
    where?: PlayerStatsWhereInput
    /**
     * Limit how many PlayerStats to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerStatsIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * PlayerStats upsert
   */
  export type PlayerStatsUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlayerStats
     */
    select?: PlayerStatsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PlayerStats
     */
    omit?: PlayerStatsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerStatsInclude<ExtArgs> | null
    /**
     * The filter to search for the PlayerStats to update in case it exists.
     */
    where: PlayerStatsWhereUniqueInput
    /**
     * In case the PlayerStats found by the `where` argument doesn't exist, create a new PlayerStats with this data.
     */
    create: XOR<PlayerStatsCreateInput, PlayerStatsUncheckedCreateInput>
    /**
     * In case the PlayerStats was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PlayerStatsUpdateInput, PlayerStatsUncheckedUpdateInput>
  }

  /**
   * PlayerStats delete
   */
  export type PlayerStatsDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlayerStats
     */
    select?: PlayerStatsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PlayerStats
     */
    omit?: PlayerStatsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerStatsInclude<ExtArgs> | null
    /**
     * Filter which PlayerStats to delete.
     */
    where: PlayerStatsWhereUniqueInput
  }

  /**
   * PlayerStats deleteMany
   */
  export type PlayerStatsDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PlayerStats to delete
     */
    where?: PlayerStatsWhereInput
    /**
     * Limit how many PlayerStats to delete.
     */
    limit?: number
  }

  /**
   * PlayerStats without action
   */
  export type PlayerStatsDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlayerStats
     */
    select?: PlayerStatsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PlayerStats
     */
    omit?: PlayerStatsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerStatsInclude<ExtArgs> | null
  }


  /**
   * Model Team
   */

  export type AggregateTeam = {
    _count: TeamCountAggregateOutputType | null
    _avg: TeamAvgAggregateOutputType | null
    _sum: TeamSumAggregateOutputType | null
    _min: TeamMinAggregateOutputType | null
    _max: TeamMaxAggregateOutputType | null
  }

  export type TeamAvgAggregateOutputType = {
    teamNumber: number | null
  }

  export type TeamSumAggregateOutputType = {
    teamNumber: number | null
  }

  export type TeamMinAggregateOutputType = {
    id: string | null
    name: string | null
    createdAt: Date | null
    teamNumber: number | null
    playerStatsId: string | null
    tournamentId: string | null
  }

  export type TeamMaxAggregateOutputType = {
    id: string | null
    name: string | null
    createdAt: Date | null
    teamNumber: number | null
    playerStatsId: string | null
    tournamentId: string | null
  }

  export type TeamCountAggregateOutputType = {
    id: number
    name: number
    createdAt: number
    teamNumber: number
    playerStatsId: number
    tournamentId: number
    _all: number
  }


  export type TeamAvgAggregateInputType = {
    teamNumber?: true
  }

  export type TeamSumAggregateInputType = {
    teamNumber?: true
  }

  export type TeamMinAggregateInputType = {
    id?: true
    name?: true
    createdAt?: true
    teamNumber?: true
    playerStatsId?: true
    tournamentId?: true
  }

  export type TeamMaxAggregateInputType = {
    id?: true
    name?: true
    createdAt?: true
    teamNumber?: true
    playerStatsId?: true
    tournamentId?: true
  }

  export type TeamCountAggregateInputType = {
    id?: true
    name?: true
    createdAt?: true
    teamNumber?: true
    playerStatsId?: true
    tournamentId?: true
    _all?: true
  }

  export type TeamAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Team to aggregate.
     */
    where?: TeamWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Teams to fetch.
     */
    orderBy?: TeamOrderByWithRelationInput | TeamOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TeamWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Teams from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Teams.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Teams
    **/
    _count?: true | TeamCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TeamAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TeamSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TeamMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TeamMaxAggregateInputType
  }

  export type GetTeamAggregateType<T extends TeamAggregateArgs> = {
        [P in keyof T & keyof AggregateTeam]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTeam[P]>
      : GetScalarType<T[P], AggregateTeam[P]>
  }




  export type TeamGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TeamWhereInput
    orderBy?: TeamOrderByWithAggregationInput | TeamOrderByWithAggregationInput[]
    by: TeamScalarFieldEnum[] | TeamScalarFieldEnum
    having?: TeamScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TeamCountAggregateInputType | true
    _avg?: TeamAvgAggregateInputType
    _sum?: TeamSumAggregateInputType
    _min?: TeamMinAggregateInputType
    _max?: TeamMaxAggregateInputType
  }

  export type TeamGroupByOutputType = {
    id: string
    name: string
    createdAt: Date
    teamNumber: number
    playerStatsId: string | null
    tournamentId: string | null
    _count: TeamCountAggregateOutputType | null
    _avg: TeamAvgAggregateOutputType | null
    _sum: TeamSumAggregateOutputType | null
    _min: TeamMinAggregateOutputType | null
    _max: TeamMaxAggregateOutputType | null
  }

  type GetTeamGroupByPayload<T extends TeamGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TeamGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TeamGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TeamGroupByOutputType[P]>
            : GetScalarType<T[P], TeamGroupByOutputType[P]>
        }
      >
    >


  export type TeamSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    createdAt?: boolean
    teamNumber?: boolean
    playerStatsId?: boolean
    tournamentId?: boolean
    players?: boolean | Team$playersArgs<ExtArgs>
    tournament?: boolean | Team$tournamentArgs<ExtArgs>
    _count?: boolean | TeamCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["team"]>

  export type TeamSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    createdAt?: boolean
    teamNumber?: boolean
    playerStatsId?: boolean
    tournamentId?: boolean
    tournament?: boolean | Team$tournamentArgs<ExtArgs>
  }, ExtArgs["result"]["team"]>

  export type TeamSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    createdAt?: boolean
    teamNumber?: boolean
    playerStatsId?: boolean
    tournamentId?: boolean
    tournament?: boolean | Team$tournamentArgs<ExtArgs>
  }, ExtArgs["result"]["team"]>

  export type TeamSelectScalar = {
    id?: boolean
    name?: boolean
    createdAt?: boolean
    teamNumber?: boolean
    playerStatsId?: boolean
    tournamentId?: boolean
  }

  export type TeamOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "createdAt" | "teamNumber" | "playerStatsId" | "tournamentId", ExtArgs["result"]["team"]>
  export type TeamInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    players?: boolean | Team$playersArgs<ExtArgs>
    tournament?: boolean | Team$tournamentArgs<ExtArgs>
    _count?: boolean | TeamCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type TeamIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tournament?: boolean | Team$tournamentArgs<ExtArgs>
  }
  export type TeamIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tournament?: boolean | Team$tournamentArgs<ExtArgs>
  }

  export type $TeamPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Team"
    objects: {
      players: Prisma.$PlayerPayload<ExtArgs>[]
      tournament: Prisma.$TournamentPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      createdAt: Date
      teamNumber: number
      playerStatsId: string | null
      tournamentId: string | null
    }, ExtArgs["result"]["team"]>
    composites: {}
  }

  type TeamGetPayload<S extends boolean | null | undefined | TeamDefaultArgs> = $Result.GetResult<Prisma.$TeamPayload, S>

  type TeamCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TeamFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TeamCountAggregateInputType | true
    }

  export interface TeamDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Team'], meta: { name: 'Team' } }
    /**
     * Find zero or one Team that matches the filter.
     * @param {TeamFindUniqueArgs} args - Arguments to find a Team
     * @example
     * // Get one Team
     * const team = await prisma.team.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TeamFindUniqueArgs>(args: SelectSubset<T, TeamFindUniqueArgs<ExtArgs>>): Prisma__TeamClient<$Result.GetResult<Prisma.$TeamPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Team that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TeamFindUniqueOrThrowArgs} args - Arguments to find a Team
     * @example
     * // Get one Team
     * const team = await prisma.team.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TeamFindUniqueOrThrowArgs>(args: SelectSubset<T, TeamFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TeamClient<$Result.GetResult<Prisma.$TeamPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Team that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeamFindFirstArgs} args - Arguments to find a Team
     * @example
     * // Get one Team
     * const team = await prisma.team.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TeamFindFirstArgs>(args?: SelectSubset<T, TeamFindFirstArgs<ExtArgs>>): Prisma__TeamClient<$Result.GetResult<Prisma.$TeamPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Team that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeamFindFirstOrThrowArgs} args - Arguments to find a Team
     * @example
     * // Get one Team
     * const team = await prisma.team.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TeamFindFirstOrThrowArgs>(args?: SelectSubset<T, TeamFindFirstOrThrowArgs<ExtArgs>>): Prisma__TeamClient<$Result.GetResult<Prisma.$TeamPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Teams that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeamFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Teams
     * const teams = await prisma.team.findMany()
     * 
     * // Get first 10 Teams
     * const teams = await prisma.team.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const teamWithIdOnly = await prisma.team.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TeamFindManyArgs>(args?: SelectSubset<T, TeamFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TeamPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Team.
     * @param {TeamCreateArgs} args - Arguments to create a Team.
     * @example
     * // Create one Team
     * const Team = await prisma.team.create({
     *   data: {
     *     // ... data to create a Team
     *   }
     * })
     * 
     */
    create<T extends TeamCreateArgs>(args: SelectSubset<T, TeamCreateArgs<ExtArgs>>): Prisma__TeamClient<$Result.GetResult<Prisma.$TeamPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Teams.
     * @param {TeamCreateManyArgs} args - Arguments to create many Teams.
     * @example
     * // Create many Teams
     * const team = await prisma.team.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TeamCreateManyArgs>(args?: SelectSubset<T, TeamCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Teams and returns the data saved in the database.
     * @param {TeamCreateManyAndReturnArgs} args - Arguments to create many Teams.
     * @example
     * // Create many Teams
     * const team = await prisma.team.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Teams and only return the `id`
     * const teamWithIdOnly = await prisma.team.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TeamCreateManyAndReturnArgs>(args?: SelectSubset<T, TeamCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TeamPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Team.
     * @param {TeamDeleteArgs} args - Arguments to delete one Team.
     * @example
     * // Delete one Team
     * const Team = await prisma.team.delete({
     *   where: {
     *     // ... filter to delete one Team
     *   }
     * })
     * 
     */
    delete<T extends TeamDeleteArgs>(args: SelectSubset<T, TeamDeleteArgs<ExtArgs>>): Prisma__TeamClient<$Result.GetResult<Prisma.$TeamPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Team.
     * @param {TeamUpdateArgs} args - Arguments to update one Team.
     * @example
     * // Update one Team
     * const team = await prisma.team.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TeamUpdateArgs>(args: SelectSubset<T, TeamUpdateArgs<ExtArgs>>): Prisma__TeamClient<$Result.GetResult<Prisma.$TeamPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Teams.
     * @param {TeamDeleteManyArgs} args - Arguments to filter Teams to delete.
     * @example
     * // Delete a few Teams
     * const { count } = await prisma.team.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TeamDeleteManyArgs>(args?: SelectSubset<T, TeamDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Teams.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeamUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Teams
     * const team = await prisma.team.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TeamUpdateManyArgs>(args: SelectSubset<T, TeamUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Teams and returns the data updated in the database.
     * @param {TeamUpdateManyAndReturnArgs} args - Arguments to update many Teams.
     * @example
     * // Update many Teams
     * const team = await prisma.team.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Teams and only return the `id`
     * const teamWithIdOnly = await prisma.team.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TeamUpdateManyAndReturnArgs>(args: SelectSubset<T, TeamUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TeamPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Team.
     * @param {TeamUpsertArgs} args - Arguments to update or create a Team.
     * @example
     * // Update or create a Team
     * const team = await prisma.team.upsert({
     *   create: {
     *     // ... data to create a Team
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Team we want to update
     *   }
     * })
     */
    upsert<T extends TeamUpsertArgs>(args: SelectSubset<T, TeamUpsertArgs<ExtArgs>>): Prisma__TeamClient<$Result.GetResult<Prisma.$TeamPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Teams.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeamCountArgs} args - Arguments to filter Teams to count.
     * @example
     * // Count the number of Teams
     * const count = await prisma.team.count({
     *   where: {
     *     // ... the filter for the Teams we want to count
     *   }
     * })
    **/
    count<T extends TeamCountArgs>(
      args?: Subset<T, TeamCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TeamCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Team.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeamAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TeamAggregateArgs>(args: Subset<T, TeamAggregateArgs>): Prisma.PrismaPromise<GetTeamAggregateType<T>>

    /**
     * Group by Team.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeamGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TeamGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TeamGroupByArgs['orderBy'] }
        : { orderBy?: TeamGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TeamGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTeamGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Team model
   */
  readonly fields: TeamFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Team.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TeamClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    players<T extends Team$playersArgs<ExtArgs> = {}>(args?: Subset<T, Team$playersArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    tournament<T extends Team$tournamentArgs<ExtArgs> = {}>(args?: Subset<T, Team$tournamentArgs<ExtArgs>>): Prisma__TournamentClient<$Result.GetResult<Prisma.$TournamentPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Team model
   */
  interface TeamFieldRefs {
    readonly id: FieldRef<"Team", 'String'>
    readonly name: FieldRef<"Team", 'String'>
    readonly createdAt: FieldRef<"Team", 'DateTime'>
    readonly teamNumber: FieldRef<"Team", 'Int'>
    readonly playerStatsId: FieldRef<"Team", 'String'>
    readonly tournamentId: FieldRef<"Team", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Team findUnique
   */
  export type TeamFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Team
     */
    select?: TeamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Team
     */
    omit?: TeamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamInclude<ExtArgs> | null
    /**
     * Filter, which Team to fetch.
     */
    where: TeamWhereUniqueInput
  }

  /**
   * Team findUniqueOrThrow
   */
  export type TeamFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Team
     */
    select?: TeamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Team
     */
    omit?: TeamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamInclude<ExtArgs> | null
    /**
     * Filter, which Team to fetch.
     */
    where: TeamWhereUniqueInput
  }

  /**
   * Team findFirst
   */
  export type TeamFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Team
     */
    select?: TeamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Team
     */
    omit?: TeamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamInclude<ExtArgs> | null
    /**
     * Filter, which Team to fetch.
     */
    where?: TeamWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Teams to fetch.
     */
    orderBy?: TeamOrderByWithRelationInput | TeamOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Teams.
     */
    cursor?: TeamWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Teams from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Teams.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Teams.
     */
    distinct?: TeamScalarFieldEnum | TeamScalarFieldEnum[]
  }

  /**
   * Team findFirstOrThrow
   */
  export type TeamFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Team
     */
    select?: TeamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Team
     */
    omit?: TeamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamInclude<ExtArgs> | null
    /**
     * Filter, which Team to fetch.
     */
    where?: TeamWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Teams to fetch.
     */
    orderBy?: TeamOrderByWithRelationInput | TeamOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Teams.
     */
    cursor?: TeamWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Teams from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Teams.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Teams.
     */
    distinct?: TeamScalarFieldEnum | TeamScalarFieldEnum[]
  }

  /**
   * Team findMany
   */
  export type TeamFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Team
     */
    select?: TeamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Team
     */
    omit?: TeamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamInclude<ExtArgs> | null
    /**
     * Filter, which Teams to fetch.
     */
    where?: TeamWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Teams to fetch.
     */
    orderBy?: TeamOrderByWithRelationInput | TeamOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Teams.
     */
    cursor?: TeamWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Teams from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Teams.
     */
    skip?: number
    distinct?: TeamScalarFieldEnum | TeamScalarFieldEnum[]
  }

  /**
   * Team create
   */
  export type TeamCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Team
     */
    select?: TeamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Team
     */
    omit?: TeamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamInclude<ExtArgs> | null
    /**
     * The data needed to create a Team.
     */
    data: XOR<TeamCreateInput, TeamUncheckedCreateInput>
  }

  /**
   * Team createMany
   */
  export type TeamCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Teams.
     */
    data: TeamCreateManyInput | TeamCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Team createManyAndReturn
   */
  export type TeamCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Team
     */
    select?: TeamSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Team
     */
    omit?: TeamOmit<ExtArgs> | null
    /**
     * The data used to create many Teams.
     */
    data: TeamCreateManyInput | TeamCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Team update
   */
  export type TeamUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Team
     */
    select?: TeamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Team
     */
    omit?: TeamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamInclude<ExtArgs> | null
    /**
     * The data needed to update a Team.
     */
    data: XOR<TeamUpdateInput, TeamUncheckedUpdateInput>
    /**
     * Choose, which Team to update.
     */
    where: TeamWhereUniqueInput
  }

  /**
   * Team updateMany
   */
  export type TeamUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Teams.
     */
    data: XOR<TeamUpdateManyMutationInput, TeamUncheckedUpdateManyInput>
    /**
     * Filter which Teams to update
     */
    where?: TeamWhereInput
    /**
     * Limit how many Teams to update.
     */
    limit?: number
  }

  /**
   * Team updateManyAndReturn
   */
  export type TeamUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Team
     */
    select?: TeamSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Team
     */
    omit?: TeamOmit<ExtArgs> | null
    /**
     * The data used to update Teams.
     */
    data: XOR<TeamUpdateManyMutationInput, TeamUncheckedUpdateManyInput>
    /**
     * Filter which Teams to update
     */
    where?: TeamWhereInput
    /**
     * Limit how many Teams to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Team upsert
   */
  export type TeamUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Team
     */
    select?: TeamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Team
     */
    omit?: TeamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamInclude<ExtArgs> | null
    /**
     * The filter to search for the Team to update in case it exists.
     */
    where: TeamWhereUniqueInput
    /**
     * In case the Team found by the `where` argument doesn't exist, create a new Team with this data.
     */
    create: XOR<TeamCreateInput, TeamUncheckedCreateInput>
    /**
     * In case the Team was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TeamUpdateInput, TeamUncheckedUpdateInput>
  }

  /**
   * Team delete
   */
  export type TeamDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Team
     */
    select?: TeamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Team
     */
    omit?: TeamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamInclude<ExtArgs> | null
    /**
     * Filter which Team to delete.
     */
    where: TeamWhereUniqueInput
  }

  /**
   * Team deleteMany
   */
  export type TeamDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Teams to delete
     */
    where?: TeamWhereInput
    /**
     * Limit how many Teams to delete.
     */
    limit?: number
  }

  /**
   * Team.players
   */
  export type Team$playersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Player
     */
    select?: PlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Player
     */
    omit?: PlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerInclude<ExtArgs> | null
    where?: PlayerWhereInput
    orderBy?: PlayerOrderByWithRelationInput | PlayerOrderByWithRelationInput[]
    cursor?: PlayerWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PlayerScalarFieldEnum | PlayerScalarFieldEnum[]
  }

  /**
   * Team.tournament
   */
  export type Team$tournamentArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tournament
     */
    select?: TournamentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Tournament
     */
    omit?: TournamentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TournamentInclude<ExtArgs> | null
    where?: TournamentWhereInput
  }

  /**
   * Team without action
   */
  export type TeamDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Team
     */
    select?: TeamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Team
     */
    omit?: TeamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamInclude<ExtArgs> | null
  }


  /**
   * Model KDStats
   */

  export type AggregateKDStats = {
    _count: KDStatsCountAggregateOutputType | null
    _avg: KDStatsAvgAggregateOutputType | null
    _sum: KDStatsSumAggregateOutputType | null
    _min: KDStatsMinAggregateOutputType | null
    _max: KDStatsMaxAggregateOutputType | null
  }

  export type KDStatsAvgAggregateOutputType = {
    kd: number | null
  }

  export type KDStatsSumAggregateOutputType = {
    kd: number | null
  }

  export type KDStatsMinAggregateOutputType = {
    id: string | null
    playerId: string | null
    kd: number | null
  }

  export type KDStatsMaxAggregateOutputType = {
    id: string | null
    playerId: string | null
    kd: number | null
  }

  export type KDStatsCountAggregateOutputType = {
    id: number
    playerId: number
    kd: number
    _all: number
  }


  export type KDStatsAvgAggregateInputType = {
    kd?: true
  }

  export type KDStatsSumAggregateInputType = {
    kd?: true
  }

  export type KDStatsMinAggregateInputType = {
    id?: true
    playerId?: true
    kd?: true
  }

  export type KDStatsMaxAggregateInputType = {
    id?: true
    playerId?: true
    kd?: true
  }

  export type KDStatsCountAggregateInputType = {
    id?: true
    playerId?: true
    kd?: true
    _all?: true
  }

  export type KDStatsAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which KDStats to aggregate.
     */
    where?: KDStatsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of KDStats to fetch.
     */
    orderBy?: KDStatsOrderByWithRelationInput | KDStatsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: KDStatsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` KDStats from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` KDStats.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned KDStats
    **/
    _count?: true | KDStatsCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: KDStatsAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: KDStatsSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: KDStatsMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: KDStatsMaxAggregateInputType
  }

  export type GetKDStatsAggregateType<T extends KDStatsAggregateArgs> = {
        [P in keyof T & keyof AggregateKDStats]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateKDStats[P]>
      : GetScalarType<T[P], AggregateKDStats[P]>
  }




  export type KDStatsGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: KDStatsWhereInput
    orderBy?: KDStatsOrderByWithAggregationInput | KDStatsOrderByWithAggregationInput[]
    by: KDStatsScalarFieldEnum[] | KDStatsScalarFieldEnum
    having?: KDStatsScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: KDStatsCountAggregateInputType | true
    _avg?: KDStatsAvgAggregateInputType
    _sum?: KDStatsSumAggregateInputType
    _min?: KDStatsMinAggregateInputType
    _max?: KDStatsMaxAggregateInputType
  }

  export type KDStatsGroupByOutputType = {
    id: string
    playerId: string
    kd: number
    _count: KDStatsCountAggregateOutputType | null
    _avg: KDStatsAvgAggregateOutputType | null
    _sum: KDStatsSumAggregateOutputType | null
    _min: KDStatsMinAggregateOutputType | null
    _max: KDStatsMaxAggregateOutputType | null
  }

  type GetKDStatsGroupByPayload<T extends KDStatsGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<KDStatsGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof KDStatsGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], KDStatsGroupByOutputType[P]>
            : GetScalarType<T[P], KDStatsGroupByOutputType[P]>
        }
      >
    >


  export type KDStatsSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    playerId?: boolean
    kd?: boolean
  }, ExtArgs["result"]["kDStats"]>

  export type KDStatsSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    playerId?: boolean
    kd?: boolean
  }, ExtArgs["result"]["kDStats"]>

  export type KDStatsSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    playerId?: boolean
    kd?: boolean
  }, ExtArgs["result"]["kDStats"]>

  export type KDStatsSelectScalar = {
    id?: boolean
    playerId?: boolean
    kd?: boolean
  }

  export type KDStatsOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "playerId" | "kd", ExtArgs["result"]["kDStats"]>

  export type $KDStatsPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "KDStats"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      playerId: string
      kd: number
    }, ExtArgs["result"]["kDStats"]>
    composites: {}
  }

  type KDStatsGetPayload<S extends boolean | null | undefined | KDStatsDefaultArgs> = $Result.GetResult<Prisma.$KDStatsPayload, S>

  type KDStatsCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<KDStatsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: KDStatsCountAggregateInputType | true
    }

  export interface KDStatsDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['KDStats'], meta: { name: 'KDStats' } }
    /**
     * Find zero or one KDStats that matches the filter.
     * @param {KDStatsFindUniqueArgs} args - Arguments to find a KDStats
     * @example
     * // Get one KDStats
     * const kDStats = await prisma.kDStats.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends KDStatsFindUniqueArgs>(args: SelectSubset<T, KDStatsFindUniqueArgs<ExtArgs>>): Prisma__KDStatsClient<$Result.GetResult<Prisma.$KDStatsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one KDStats that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {KDStatsFindUniqueOrThrowArgs} args - Arguments to find a KDStats
     * @example
     * // Get one KDStats
     * const kDStats = await prisma.kDStats.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends KDStatsFindUniqueOrThrowArgs>(args: SelectSubset<T, KDStatsFindUniqueOrThrowArgs<ExtArgs>>): Prisma__KDStatsClient<$Result.GetResult<Prisma.$KDStatsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first KDStats that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {KDStatsFindFirstArgs} args - Arguments to find a KDStats
     * @example
     * // Get one KDStats
     * const kDStats = await prisma.kDStats.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends KDStatsFindFirstArgs>(args?: SelectSubset<T, KDStatsFindFirstArgs<ExtArgs>>): Prisma__KDStatsClient<$Result.GetResult<Prisma.$KDStatsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first KDStats that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {KDStatsFindFirstOrThrowArgs} args - Arguments to find a KDStats
     * @example
     * // Get one KDStats
     * const kDStats = await prisma.kDStats.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends KDStatsFindFirstOrThrowArgs>(args?: SelectSubset<T, KDStatsFindFirstOrThrowArgs<ExtArgs>>): Prisma__KDStatsClient<$Result.GetResult<Prisma.$KDStatsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more KDStats that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {KDStatsFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all KDStats
     * const kDStats = await prisma.kDStats.findMany()
     * 
     * // Get first 10 KDStats
     * const kDStats = await prisma.kDStats.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const kDStatsWithIdOnly = await prisma.kDStats.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends KDStatsFindManyArgs>(args?: SelectSubset<T, KDStatsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$KDStatsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a KDStats.
     * @param {KDStatsCreateArgs} args - Arguments to create a KDStats.
     * @example
     * // Create one KDStats
     * const KDStats = await prisma.kDStats.create({
     *   data: {
     *     // ... data to create a KDStats
     *   }
     * })
     * 
     */
    create<T extends KDStatsCreateArgs>(args: SelectSubset<T, KDStatsCreateArgs<ExtArgs>>): Prisma__KDStatsClient<$Result.GetResult<Prisma.$KDStatsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many KDStats.
     * @param {KDStatsCreateManyArgs} args - Arguments to create many KDStats.
     * @example
     * // Create many KDStats
     * const kDStats = await prisma.kDStats.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends KDStatsCreateManyArgs>(args?: SelectSubset<T, KDStatsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many KDStats and returns the data saved in the database.
     * @param {KDStatsCreateManyAndReturnArgs} args - Arguments to create many KDStats.
     * @example
     * // Create many KDStats
     * const kDStats = await prisma.kDStats.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many KDStats and only return the `id`
     * const kDStatsWithIdOnly = await prisma.kDStats.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends KDStatsCreateManyAndReturnArgs>(args?: SelectSubset<T, KDStatsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$KDStatsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a KDStats.
     * @param {KDStatsDeleteArgs} args - Arguments to delete one KDStats.
     * @example
     * // Delete one KDStats
     * const KDStats = await prisma.kDStats.delete({
     *   where: {
     *     // ... filter to delete one KDStats
     *   }
     * })
     * 
     */
    delete<T extends KDStatsDeleteArgs>(args: SelectSubset<T, KDStatsDeleteArgs<ExtArgs>>): Prisma__KDStatsClient<$Result.GetResult<Prisma.$KDStatsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one KDStats.
     * @param {KDStatsUpdateArgs} args - Arguments to update one KDStats.
     * @example
     * // Update one KDStats
     * const kDStats = await prisma.kDStats.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends KDStatsUpdateArgs>(args: SelectSubset<T, KDStatsUpdateArgs<ExtArgs>>): Prisma__KDStatsClient<$Result.GetResult<Prisma.$KDStatsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more KDStats.
     * @param {KDStatsDeleteManyArgs} args - Arguments to filter KDStats to delete.
     * @example
     * // Delete a few KDStats
     * const { count } = await prisma.kDStats.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends KDStatsDeleteManyArgs>(args?: SelectSubset<T, KDStatsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more KDStats.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {KDStatsUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many KDStats
     * const kDStats = await prisma.kDStats.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends KDStatsUpdateManyArgs>(args: SelectSubset<T, KDStatsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more KDStats and returns the data updated in the database.
     * @param {KDStatsUpdateManyAndReturnArgs} args - Arguments to update many KDStats.
     * @example
     * // Update many KDStats
     * const kDStats = await prisma.kDStats.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more KDStats and only return the `id`
     * const kDStatsWithIdOnly = await prisma.kDStats.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends KDStatsUpdateManyAndReturnArgs>(args: SelectSubset<T, KDStatsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$KDStatsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one KDStats.
     * @param {KDStatsUpsertArgs} args - Arguments to update or create a KDStats.
     * @example
     * // Update or create a KDStats
     * const kDStats = await prisma.kDStats.upsert({
     *   create: {
     *     // ... data to create a KDStats
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the KDStats we want to update
     *   }
     * })
     */
    upsert<T extends KDStatsUpsertArgs>(args: SelectSubset<T, KDStatsUpsertArgs<ExtArgs>>): Prisma__KDStatsClient<$Result.GetResult<Prisma.$KDStatsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of KDStats.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {KDStatsCountArgs} args - Arguments to filter KDStats to count.
     * @example
     * // Count the number of KDStats
     * const count = await prisma.kDStats.count({
     *   where: {
     *     // ... the filter for the KDStats we want to count
     *   }
     * })
    **/
    count<T extends KDStatsCountArgs>(
      args?: Subset<T, KDStatsCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], KDStatsCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a KDStats.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {KDStatsAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends KDStatsAggregateArgs>(args: Subset<T, KDStatsAggregateArgs>): Prisma.PrismaPromise<GetKDStatsAggregateType<T>>

    /**
     * Group by KDStats.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {KDStatsGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends KDStatsGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: KDStatsGroupByArgs['orderBy'] }
        : { orderBy?: KDStatsGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, KDStatsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetKDStatsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the KDStats model
   */
  readonly fields: KDStatsFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for KDStats.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__KDStatsClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the KDStats model
   */
  interface KDStatsFieldRefs {
    readonly id: FieldRef<"KDStats", 'String'>
    readonly playerId: FieldRef<"KDStats", 'String'>
    readonly kd: FieldRef<"KDStats", 'Float'>
  }
    

  // Custom InputTypes
  /**
   * KDStats findUnique
   */
  export type KDStatsFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KDStats
     */
    select?: KDStatsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KDStats
     */
    omit?: KDStatsOmit<ExtArgs> | null
    /**
     * Filter, which KDStats to fetch.
     */
    where: KDStatsWhereUniqueInput
  }

  /**
   * KDStats findUniqueOrThrow
   */
  export type KDStatsFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KDStats
     */
    select?: KDStatsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KDStats
     */
    omit?: KDStatsOmit<ExtArgs> | null
    /**
     * Filter, which KDStats to fetch.
     */
    where: KDStatsWhereUniqueInput
  }

  /**
   * KDStats findFirst
   */
  export type KDStatsFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KDStats
     */
    select?: KDStatsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KDStats
     */
    omit?: KDStatsOmit<ExtArgs> | null
    /**
     * Filter, which KDStats to fetch.
     */
    where?: KDStatsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of KDStats to fetch.
     */
    orderBy?: KDStatsOrderByWithRelationInput | KDStatsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for KDStats.
     */
    cursor?: KDStatsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` KDStats from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` KDStats.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of KDStats.
     */
    distinct?: KDStatsScalarFieldEnum | KDStatsScalarFieldEnum[]
  }

  /**
   * KDStats findFirstOrThrow
   */
  export type KDStatsFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KDStats
     */
    select?: KDStatsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KDStats
     */
    omit?: KDStatsOmit<ExtArgs> | null
    /**
     * Filter, which KDStats to fetch.
     */
    where?: KDStatsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of KDStats to fetch.
     */
    orderBy?: KDStatsOrderByWithRelationInput | KDStatsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for KDStats.
     */
    cursor?: KDStatsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` KDStats from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` KDStats.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of KDStats.
     */
    distinct?: KDStatsScalarFieldEnum | KDStatsScalarFieldEnum[]
  }

  /**
   * KDStats findMany
   */
  export type KDStatsFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KDStats
     */
    select?: KDStatsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KDStats
     */
    omit?: KDStatsOmit<ExtArgs> | null
    /**
     * Filter, which KDStats to fetch.
     */
    where?: KDStatsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of KDStats to fetch.
     */
    orderBy?: KDStatsOrderByWithRelationInput | KDStatsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing KDStats.
     */
    cursor?: KDStatsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` KDStats from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` KDStats.
     */
    skip?: number
    distinct?: KDStatsScalarFieldEnum | KDStatsScalarFieldEnum[]
  }

  /**
   * KDStats create
   */
  export type KDStatsCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KDStats
     */
    select?: KDStatsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KDStats
     */
    omit?: KDStatsOmit<ExtArgs> | null
    /**
     * The data needed to create a KDStats.
     */
    data: XOR<KDStatsCreateInput, KDStatsUncheckedCreateInput>
  }

  /**
   * KDStats createMany
   */
  export type KDStatsCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many KDStats.
     */
    data: KDStatsCreateManyInput | KDStatsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * KDStats createManyAndReturn
   */
  export type KDStatsCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KDStats
     */
    select?: KDStatsSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the KDStats
     */
    omit?: KDStatsOmit<ExtArgs> | null
    /**
     * The data used to create many KDStats.
     */
    data: KDStatsCreateManyInput | KDStatsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * KDStats update
   */
  export type KDStatsUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KDStats
     */
    select?: KDStatsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KDStats
     */
    omit?: KDStatsOmit<ExtArgs> | null
    /**
     * The data needed to update a KDStats.
     */
    data: XOR<KDStatsUpdateInput, KDStatsUncheckedUpdateInput>
    /**
     * Choose, which KDStats to update.
     */
    where: KDStatsWhereUniqueInput
  }

  /**
   * KDStats updateMany
   */
  export type KDStatsUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update KDStats.
     */
    data: XOR<KDStatsUpdateManyMutationInput, KDStatsUncheckedUpdateManyInput>
    /**
     * Filter which KDStats to update
     */
    where?: KDStatsWhereInput
    /**
     * Limit how many KDStats to update.
     */
    limit?: number
  }

  /**
   * KDStats updateManyAndReturn
   */
  export type KDStatsUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KDStats
     */
    select?: KDStatsSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the KDStats
     */
    omit?: KDStatsOmit<ExtArgs> | null
    /**
     * The data used to update KDStats.
     */
    data: XOR<KDStatsUpdateManyMutationInput, KDStatsUncheckedUpdateManyInput>
    /**
     * Filter which KDStats to update
     */
    where?: KDStatsWhereInput
    /**
     * Limit how many KDStats to update.
     */
    limit?: number
  }

  /**
   * KDStats upsert
   */
  export type KDStatsUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KDStats
     */
    select?: KDStatsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KDStats
     */
    omit?: KDStatsOmit<ExtArgs> | null
    /**
     * The filter to search for the KDStats to update in case it exists.
     */
    where: KDStatsWhereUniqueInput
    /**
     * In case the KDStats found by the `where` argument doesn't exist, create a new KDStats with this data.
     */
    create: XOR<KDStatsCreateInput, KDStatsUncheckedCreateInput>
    /**
     * In case the KDStats was found with the provided `where` argument, update it with this data.
     */
    update: XOR<KDStatsUpdateInput, KDStatsUncheckedUpdateInput>
  }

  /**
   * KDStats delete
   */
  export type KDStatsDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KDStats
     */
    select?: KDStatsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KDStats
     */
    omit?: KDStatsOmit<ExtArgs> | null
    /**
     * Filter which KDStats to delete.
     */
    where: KDStatsWhereUniqueInput
  }

  /**
   * KDStats deleteMany
   */
  export type KDStatsDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which KDStats to delete
     */
    where?: KDStatsWhereInput
    /**
     * Limit how many KDStats to delete.
     */
    limit?: number
  }

  /**
   * KDStats without action
   */
  export type KDStatsDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KDStats
     */
    select?: KDStatsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KDStats
     */
    omit?: KDStatsOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const UserScalarFieldEnum: {
    id: 'id',
    email: 'email',
    clerkId: 'clerkId',
    isEmailLinked: 'isEmailLinked',
    userName: 'userName',
    usernameLastChangeAt: 'usernameLastChangeAt',
    role: 'role',
    balance: 'balance',
    isInternal: 'isInternal',
    isVerified: 'isVerified',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    playerId: 'playerId',
    tournamentId: 'tournamentId'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const PlayerScalarFieldEnum: {
    id: 'id',
    isBanned: 'isBanned',
    category: 'category',
    userId: 'userId',
    teamId: 'teamId',
    characterImageId: 'characterImageId'
  };

  export type PlayerScalarFieldEnum = (typeof PlayerScalarFieldEnum)[keyof typeof PlayerScalarFieldEnum]


  export const GameScoreScalarFieldEnum: {
    highScore: 'highScore',
    lastPlayedAt: 'lastPlayedAt',
    playerId: 'playerId'
  };

  export type GameScoreScalarFieldEnum = (typeof GameScoreScalarFieldEnum)[keyof typeof GameScoreScalarFieldEnum]


  export const GalleryScalarFieldEnum: {
    id: 'id',
    imageId: 'imageId',
    name: 'name',
    path: 'path',
    fullPath: 'fullPath',
    publicUrl: 'publicUrl',
    isCharacterImg: 'isCharacterImg',
    playerId: 'playerId'
  };

  export type GalleryScalarFieldEnum = (typeof GalleryScalarFieldEnum)[keyof typeof GalleryScalarFieldEnum]


  export const SeasonScalarFieldEnum: {
    id: 'id',
    name: 'name',
    description: 'description',
    startDate: 'startDate',
    endDate: 'endDate',
    status: 'status',
    createdBy: 'createdBy',
    createdAt: 'createdAt'
  };

  export type SeasonScalarFieldEnum = (typeof SeasonScalarFieldEnum)[keyof typeof SeasonScalarFieldEnum]


  export const TournamentScalarFieldEnum: {
    id: 'id',
    name: 'name',
    startDate: 'startDate',
    fee: 'fee',
    seasonId: 'seasonId',
    createdBy: 'createdBy',
    createdAt: 'createdAt',
    galleryId: 'galleryId'
  };

  export type TournamentScalarFieldEnum = (typeof TournamentScalarFieldEnum)[keyof typeof TournamentScalarFieldEnum]


  export const PollVoteScalarFieldEnum: {
    id: 'id',
    vote: 'vote',
    inOption: 'inOption',
    outOption: 'outOption',
    soloOption: 'soloOption',
    startDate: 'startDate',
    endDate: 'endDate',
    playerId: 'playerId',
    tournamentId: 'tournamentId',
    createdAt: 'createdAt'
  };

  export type PollVoteScalarFieldEnum = (typeof PollVoteScalarFieldEnum)[keyof typeof PollVoteScalarFieldEnum]


  export const TournamentWinnerScalarFieldEnum: {
    id: 'id',
    playerId: 'playerId',
    position: 'position',
    tournamentId: 'tournamentId',
    createdAt: 'createdAt'
  };

  export type TournamentWinnerScalarFieldEnum = (typeof TournamentWinnerScalarFieldEnum)[keyof typeof TournamentWinnerScalarFieldEnum]


  export const MatchScalarFieldEnum: {
    id: 'id',
    matchName: 'matchName',
    tournamentId: 'tournamentId',
    createdAt: 'createdAt'
  };

  export type MatchScalarFieldEnum = (typeof MatchScalarFieldEnum)[keyof typeof MatchScalarFieldEnum]


  export const WalletScalarFieldEnum: {
    id: 'id',
    amount: 'amount',
    createdAt: 'createdAt',
    playerId: 'playerId',
    userId: 'userId'
  };

  export type WalletScalarFieldEnum = (typeof WalletScalarFieldEnum)[keyof typeof WalletScalarFieldEnum]


  export const PlayerStatsScalarFieldEnum: {
    id: 'id',
    playerId: 'playerId',
    matches: 'matches',
    wins: 'wins',
    deaths: 'deaths',
    kills: 'kills',
    kd: 'kd',
    createdAt: 'createdAt'
  };

  export type PlayerStatsScalarFieldEnum = (typeof PlayerStatsScalarFieldEnum)[keyof typeof PlayerStatsScalarFieldEnum]


  export const TeamScalarFieldEnum: {
    id: 'id',
    name: 'name',
    createdAt: 'createdAt',
    teamNumber: 'teamNumber',
    playerStatsId: 'playerStatsId',
    tournamentId: 'tournamentId'
  };

  export type TeamScalarFieldEnum = (typeof TeamScalarFieldEnum)[keyof typeof TeamScalarFieldEnum]


  export const KDStatsScalarFieldEnum: {
    id: 'id',
    playerId: 'playerId',
    kd: 'kd'
  };

  export type KDStatsScalarFieldEnum = (typeof KDStatsScalarFieldEnum)[keyof typeof KDStatsScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Role'
   */
  export type EnumRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Role'>
    


  /**
   * Reference to a field of type 'Role[]'
   */
  export type ListEnumRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Role[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'PlayerCategory'
   */
  export type EnumPlayerCategoryFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PlayerCategory'>
    


  /**
   * Reference to a field of type 'PlayerCategory[]'
   */
  export type ListEnumPlayerCategoryFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PlayerCategory[]'>
    


  /**
   * Reference to a field of type 'SeasonStatus'
   */
  export type EnumSeasonStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SeasonStatus'>
    


  /**
   * Reference to a field of type 'SeasonStatus[]'
   */
  export type ListEnumSeasonStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SeasonStatus[]'>
    


  /**
   * Reference to a field of type 'Vote'
   */
  export type EnumVoteFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Vote'>
    


  /**
   * Reference to a field of type 'Vote[]'
   */
  export type ListEnumVoteFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Vote[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: StringFilter<"User"> | string
    email?: StringNullableFilter<"User"> | string | null
    clerkId?: StringFilter<"User"> | string
    isEmailLinked?: BoolFilter<"User"> | boolean
    userName?: StringFilter<"User"> | string
    usernameLastChangeAt?: DateTimeFilter<"User"> | Date | string
    role?: EnumRoleFilter<"User"> | $Enums.Role
    balance?: IntFilter<"User"> | number
    isInternal?: BoolFilter<"User"> | boolean
    isVerified?: BoolFilter<"User"> | boolean
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    playerId?: StringNullableFilter<"User"> | string | null
    tournamentId?: StringNullableFilter<"User"> | string | null
    player?: XOR<PlayerNullableScalarRelationFilter, PlayerWhereInput> | null
    tournament?: XOR<TournamentNullableScalarRelationFilter, TournamentWhereInput> | null
    wallet?: XOR<WalletNullableScalarRelationFilter, WalletWhereInput> | null
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    email?: SortOrderInput | SortOrder
    clerkId?: SortOrder
    isEmailLinked?: SortOrder
    userName?: SortOrder
    usernameLastChangeAt?: SortOrder
    role?: SortOrder
    balance?: SortOrder
    isInternal?: SortOrder
    isVerified?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    playerId?: SortOrderInput | SortOrder
    tournamentId?: SortOrderInput | SortOrder
    player?: PlayerOrderByWithRelationInput
    tournament?: TournamentOrderByWithRelationInput
    wallet?: WalletOrderByWithRelationInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    email?: string
    clerkId?: string
    userName?: string
    playerId?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    isEmailLinked?: BoolFilter<"User"> | boolean
    usernameLastChangeAt?: DateTimeFilter<"User"> | Date | string
    role?: EnumRoleFilter<"User"> | $Enums.Role
    balance?: IntFilter<"User"> | number
    isInternal?: BoolFilter<"User"> | boolean
    isVerified?: BoolFilter<"User"> | boolean
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    tournamentId?: StringNullableFilter<"User"> | string | null
    player?: XOR<PlayerNullableScalarRelationFilter, PlayerWhereInput> | null
    tournament?: XOR<TournamentNullableScalarRelationFilter, TournamentWhereInput> | null
    wallet?: XOR<WalletNullableScalarRelationFilter, WalletWhereInput> | null
  }, "id" | "email" | "clerkId" | "userName" | "playerId">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    email?: SortOrderInput | SortOrder
    clerkId?: SortOrder
    isEmailLinked?: SortOrder
    userName?: SortOrder
    usernameLastChangeAt?: SortOrder
    role?: SortOrder
    balance?: SortOrder
    isInternal?: SortOrder
    isVerified?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    playerId?: SortOrderInput | SortOrder
    tournamentId?: SortOrderInput | SortOrder
    _count?: UserCountOrderByAggregateInput
    _avg?: UserAvgOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
    _sum?: UserSumOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"User"> | string
    email?: StringNullableWithAggregatesFilter<"User"> | string | null
    clerkId?: StringWithAggregatesFilter<"User"> | string
    isEmailLinked?: BoolWithAggregatesFilter<"User"> | boolean
    userName?: StringWithAggregatesFilter<"User"> | string
    usernameLastChangeAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    role?: EnumRoleWithAggregatesFilter<"User"> | $Enums.Role
    balance?: IntWithAggregatesFilter<"User"> | number
    isInternal?: BoolWithAggregatesFilter<"User"> | boolean
    isVerified?: BoolWithAggregatesFilter<"User"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    playerId?: StringNullableWithAggregatesFilter<"User"> | string | null
    tournamentId?: StringNullableWithAggregatesFilter<"User"> | string | null
  }

  export type PlayerWhereInput = {
    AND?: PlayerWhereInput | PlayerWhereInput[]
    OR?: PlayerWhereInput[]
    NOT?: PlayerWhereInput | PlayerWhereInput[]
    id?: StringFilter<"Player"> | string
    isBanned?: BoolFilter<"Player"> | boolean
    category?: EnumPlayerCategoryFilter<"Player"> | $Enums.PlayerCategory
    userId?: StringFilter<"Player"> | string
    teamId?: StringNullableFilter<"Player"> | string | null
    characterImageId?: StringNullableFilter<"Player"> | string | null
    gameScore?: GameScoreListRelationFilter
    pollVote?: XOR<PollVoteNullableScalarRelationFilter, PollVoteWhereInput> | null
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    tournamentWinner?: TournamentWinnerListRelationFilter
    Wallet?: XOR<WalletNullableScalarRelationFilter, WalletWhereInput> | null
    playerStats?: XOR<PlayerStatsNullableScalarRelationFilter, PlayerStatsWhereInput> | null
    team?: XOR<TeamNullableScalarRelationFilter, TeamWhereInput> | null
    characterImage?: XOR<GalleryNullableScalarRelationFilter, GalleryWhereInput> | null
  }

  export type PlayerOrderByWithRelationInput = {
    id?: SortOrder
    isBanned?: SortOrder
    category?: SortOrder
    userId?: SortOrder
    teamId?: SortOrderInput | SortOrder
    characterImageId?: SortOrderInput | SortOrder
    gameScore?: GameScoreOrderByRelationAggregateInput
    pollVote?: PollVoteOrderByWithRelationInput
    user?: UserOrderByWithRelationInput
    tournamentWinner?: TournamentWinnerOrderByRelationAggregateInput
    Wallet?: WalletOrderByWithRelationInput
    playerStats?: PlayerStatsOrderByWithRelationInput
    team?: TeamOrderByWithRelationInput
    characterImage?: GalleryOrderByWithRelationInput
  }

  export type PlayerWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    userId?: string
    characterImageId?: string
    AND?: PlayerWhereInput | PlayerWhereInput[]
    OR?: PlayerWhereInput[]
    NOT?: PlayerWhereInput | PlayerWhereInput[]
    isBanned?: BoolFilter<"Player"> | boolean
    category?: EnumPlayerCategoryFilter<"Player"> | $Enums.PlayerCategory
    teamId?: StringNullableFilter<"Player"> | string | null
    gameScore?: GameScoreListRelationFilter
    pollVote?: XOR<PollVoteNullableScalarRelationFilter, PollVoteWhereInput> | null
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    tournamentWinner?: TournamentWinnerListRelationFilter
    Wallet?: XOR<WalletNullableScalarRelationFilter, WalletWhereInput> | null
    playerStats?: XOR<PlayerStatsNullableScalarRelationFilter, PlayerStatsWhereInput> | null
    team?: XOR<TeamNullableScalarRelationFilter, TeamWhereInput> | null
    characterImage?: XOR<GalleryNullableScalarRelationFilter, GalleryWhereInput> | null
  }, "id" | "userId" | "characterImageId">

  export type PlayerOrderByWithAggregationInput = {
    id?: SortOrder
    isBanned?: SortOrder
    category?: SortOrder
    userId?: SortOrder
    teamId?: SortOrderInput | SortOrder
    characterImageId?: SortOrderInput | SortOrder
    _count?: PlayerCountOrderByAggregateInput
    _max?: PlayerMaxOrderByAggregateInput
    _min?: PlayerMinOrderByAggregateInput
  }

  export type PlayerScalarWhereWithAggregatesInput = {
    AND?: PlayerScalarWhereWithAggregatesInput | PlayerScalarWhereWithAggregatesInput[]
    OR?: PlayerScalarWhereWithAggregatesInput[]
    NOT?: PlayerScalarWhereWithAggregatesInput | PlayerScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Player"> | string
    isBanned?: BoolWithAggregatesFilter<"Player"> | boolean
    category?: EnumPlayerCategoryWithAggregatesFilter<"Player"> | $Enums.PlayerCategory
    userId?: StringWithAggregatesFilter<"Player"> | string
    teamId?: StringNullableWithAggregatesFilter<"Player"> | string | null
    characterImageId?: StringNullableWithAggregatesFilter<"Player"> | string | null
  }

  export type GameScoreWhereInput = {
    AND?: GameScoreWhereInput | GameScoreWhereInput[]
    OR?: GameScoreWhereInput[]
    NOT?: GameScoreWhereInput | GameScoreWhereInput[]
    highScore?: IntFilter<"GameScore"> | number
    lastPlayedAt?: DateTimeFilter<"GameScore"> | Date | string
    playerId?: StringFilter<"GameScore"> | string
    player?: XOR<PlayerScalarRelationFilter, PlayerWhereInput>
  }

  export type GameScoreOrderByWithRelationInput = {
    highScore?: SortOrder
    lastPlayedAt?: SortOrder
    playerId?: SortOrder
    player?: PlayerOrderByWithRelationInput
  }

  export type GameScoreWhereUniqueInput = Prisma.AtLeast<{
    playerId?: string
    AND?: GameScoreWhereInput | GameScoreWhereInput[]
    OR?: GameScoreWhereInput[]
    NOT?: GameScoreWhereInput | GameScoreWhereInput[]
    highScore?: IntFilter<"GameScore"> | number
    lastPlayedAt?: DateTimeFilter<"GameScore"> | Date | string
    player?: XOR<PlayerScalarRelationFilter, PlayerWhereInput>
  }, "playerId">

  export type GameScoreOrderByWithAggregationInput = {
    highScore?: SortOrder
    lastPlayedAt?: SortOrder
    playerId?: SortOrder
    _count?: GameScoreCountOrderByAggregateInput
    _avg?: GameScoreAvgOrderByAggregateInput
    _max?: GameScoreMaxOrderByAggregateInput
    _min?: GameScoreMinOrderByAggregateInput
    _sum?: GameScoreSumOrderByAggregateInput
  }

  export type GameScoreScalarWhereWithAggregatesInput = {
    AND?: GameScoreScalarWhereWithAggregatesInput | GameScoreScalarWhereWithAggregatesInput[]
    OR?: GameScoreScalarWhereWithAggregatesInput[]
    NOT?: GameScoreScalarWhereWithAggregatesInput | GameScoreScalarWhereWithAggregatesInput[]
    highScore?: IntWithAggregatesFilter<"GameScore"> | number
    lastPlayedAt?: DateTimeWithAggregatesFilter<"GameScore"> | Date | string
    playerId?: StringWithAggregatesFilter<"GameScore"> | string
  }

  export type GalleryWhereInput = {
    AND?: GalleryWhereInput | GalleryWhereInput[]
    OR?: GalleryWhereInput[]
    NOT?: GalleryWhereInput | GalleryWhereInput[]
    id?: StringFilter<"Gallery"> | string
    imageId?: StringFilter<"Gallery"> | string
    name?: StringFilter<"Gallery"> | string
    path?: StringFilter<"Gallery"> | string
    fullPath?: StringFilter<"Gallery"> | string
    publicUrl?: StringFilter<"Gallery"> | string
    isCharacterImg?: BoolFilter<"Gallery"> | boolean
    playerId?: StringNullableFilter<"Gallery"> | string | null
    player?: XOR<PlayerNullableScalarRelationFilter, PlayerWhereInput> | null
    tournament?: TournamentListRelationFilter
  }

  export type GalleryOrderByWithRelationInput = {
    id?: SortOrder
    imageId?: SortOrder
    name?: SortOrder
    path?: SortOrder
    fullPath?: SortOrder
    publicUrl?: SortOrder
    isCharacterImg?: SortOrder
    playerId?: SortOrderInput | SortOrder
    player?: PlayerOrderByWithRelationInput
    tournament?: TournamentOrderByRelationAggregateInput
  }

  export type GalleryWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    imageId?: string
    playerId?: string
    AND?: GalleryWhereInput | GalleryWhereInput[]
    OR?: GalleryWhereInput[]
    NOT?: GalleryWhereInput | GalleryWhereInput[]
    name?: StringFilter<"Gallery"> | string
    path?: StringFilter<"Gallery"> | string
    fullPath?: StringFilter<"Gallery"> | string
    publicUrl?: StringFilter<"Gallery"> | string
    isCharacterImg?: BoolFilter<"Gallery"> | boolean
    player?: XOR<PlayerNullableScalarRelationFilter, PlayerWhereInput> | null
    tournament?: TournamentListRelationFilter
  }, "id" | "imageId" | "playerId">

  export type GalleryOrderByWithAggregationInput = {
    id?: SortOrder
    imageId?: SortOrder
    name?: SortOrder
    path?: SortOrder
    fullPath?: SortOrder
    publicUrl?: SortOrder
    isCharacterImg?: SortOrder
    playerId?: SortOrderInput | SortOrder
    _count?: GalleryCountOrderByAggregateInput
    _max?: GalleryMaxOrderByAggregateInput
    _min?: GalleryMinOrderByAggregateInput
  }

  export type GalleryScalarWhereWithAggregatesInput = {
    AND?: GalleryScalarWhereWithAggregatesInput | GalleryScalarWhereWithAggregatesInput[]
    OR?: GalleryScalarWhereWithAggregatesInput[]
    NOT?: GalleryScalarWhereWithAggregatesInput | GalleryScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Gallery"> | string
    imageId?: StringWithAggregatesFilter<"Gallery"> | string
    name?: StringWithAggregatesFilter<"Gallery"> | string
    path?: StringWithAggregatesFilter<"Gallery"> | string
    fullPath?: StringWithAggregatesFilter<"Gallery"> | string
    publicUrl?: StringWithAggregatesFilter<"Gallery"> | string
    isCharacterImg?: BoolWithAggregatesFilter<"Gallery"> | boolean
    playerId?: StringNullableWithAggregatesFilter<"Gallery"> | string | null
  }

  export type SeasonWhereInput = {
    AND?: SeasonWhereInput | SeasonWhereInput[]
    OR?: SeasonWhereInput[]
    NOT?: SeasonWhereInput | SeasonWhereInput[]
    id?: StringFilter<"Season"> | string
    name?: StringFilter<"Season"> | string
    description?: StringNullableFilter<"Season"> | string | null
    startDate?: DateTimeFilter<"Season"> | Date | string
    endDate?: DateTimeFilter<"Season"> | Date | string
    status?: EnumSeasonStatusFilter<"Season"> | $Enums.SeasonStatus
    createdBy?: StringFilter<"Season"> | string
    createdAt?: DateTimeFilter<"Season"> | Date | string
    tournament?: TournamentListRelationFilter
  }

  export type SeasonOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    status?: SortOrder
    createdBy?: SortOrder
    createdAt?: SortOrder
    tournament?: TournamentOrderByRelationAggregateInput
  }

  export type SeasonWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    id_status?: SeasonIdStatusCompoundUniqueInput
    AND?: SeasonWhereInput | SeasonWhereInput[]
    OR?: SeasonWhereInput[]
    NOT?: SeasonWhereInput | SeasonWhereInput[]
    name?: StringFilter<"Season"> | string
    description?: StringNullableFilter<"Season"> | string | null
    startDate?: DateTimeFilter<"Season"> | Date | string
    endDate?: DateTimeFilter<"Season"> | Date | string
    status?: EnumSeasonStatusFilter<"Season"> | $Enums.SeasonStatus
    createdBy?: StringFilter<"Season"> | string
    createdAt?: DateTimeFilter<"Season"> | Date | string
    tournament?: TournamentListRelationFilter
  }, "id" | "id_status">

  export type SeasonOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    status?: SortOrder
    createdBy?: SortOrder
    createdAt?: SortOrder
    _count?: SeasonCountOrderByAggregateInput
    _max?: SeasonMaxOrderByAggregateInput
    _min?: SeasonMinOrderByAggregateInput
  }

  export type SeasonScalarWhereWithAggregatesInput = {
    AND?: SeasonScalarWhereWithAggregatesInput | SeasonScalarWhereWithAggregatesInput[]
    OR?: SeasonScalarWhereWithAggregatesInput[]
    NOT?: SeasonScalarWhereWithAggregatesInput | SeasonScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Season"> | string
    name?: StringWithAggregatesFilter<"Season"> | string
    description?: StringNullableWithAggregatesFilter<"Season"> | string | null
    startDate?: DateTimeWithAggregatesFilter<"Season"> | Date | string
    endDate?: DateTimeWithAggregatesFilter<"Season"> | Date | string
    status?: EnumSeasonStatusWithAggregatesFilter<"Season"> | $Enums.SeasonStatus
    createdBy?: StringWithAggregatesFilter<"Season"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Season"> | Date | string
  }

  export type TournamentWhereInput = {
    AND?: TournamentWhereInput | TournamentWhereInput[]
    OR?: TournamentWhereInput[]
    NOT?: TournamentWhereInput | TournamentWhereInput[]
    id?: StringFilter<"Tournament"> | string
    name?: StringFilter<"Tournament"> | string
    startDate?: DateTimeFilter<"Tournament"> | Date | string
    fee?: IntNullableFilter<"Tournament"> | number | null
    seasonId?: StringNullableFilter<"Tournament"> | string | null
    createdBy?: StringNullableFilter<"Tournament"> | string | null
    createdAt?: DateTimeFilter<"Tournament"> | Date | string
    galleryId?: StringNullableFilter<"Tournament"> | string | null
    team?: TeamListRelationFilter
    user?: UserListRelationFilter
    season?: XOR<SeasonNullableScalarRelationFilter, SeasonWhereInput> | null
    tournamentWinner?: TournamentWinnerListRelationFilter
    pollVote?: PollVoteListRelationFilter
    match?: MatchListRelationFilter
    gallery?: XOR<GalleryNullableScalarRelationFilter, GalleryWhereInput> | null
  }

  export type TournamentOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    startDate?: SortOrder
    fee?: SortOrderInput | SortOrder
    seasonId?: SortOrderInput | SortOrder
    createdBy?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    galleryId?: SortOrderInput | SortOrder
    team?: TeamOrderByRelationAggregateInput
    user?: UserOrderByRelationAggregateInput
    season?: SeasonOrderByWithRelationInput
    tournamentWinner?: TournamentWinnerOrderByRelationAggregateInput
    pollVote?: PollVoteOrderByRelationAggregateInput
    match?: MatchOrderByRelationAggregateInput
    gallery?: GalleryOrderByWithRelationInput
  }

  export type TournamentWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: TournamentWhereInput | TournamentWhereInput[]
    OR?: TournamentWhereInput[]
    NOT?: TournamentWhereInput | TournamentWhereInput[]
    name?: StringFilter<"Tournament"> | string
    startDate?: DateTimeFilter<"Tournament"> | Date | string
    fee?: IntNullableFilter<"Tournament"> | number | null
    seasonId?: StringNullableFilter<"Tournament"> | string | null
    createdBy?: StringNullableFilter<"Tournament"> | string | null
    createdAt?: DateTimeFilter<"Tournament"> | Date | string
    galleryId?: StringNullableFilter<"Tournament"> | string | null
    team?: TeamListRelationFilter
    user?: UserListRelationFilter
    season?: XOR<SeasonNullableScalarRelationFilter, SeasonWhereInput> | null
    tournamentWinner?: TournamentWinnerListRelationFilter
    pollVote?: PollVoteListRelationFilter
    match?: MatchListRelationFilter
    gallery?: XOR<GalleryNullableScalarRelationFilter, GalleryWhereInput> | null
  }, "id">

  export type TournamentOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    startDate?: SortOrder
    fee?: SortOrderInput | SortOrder
    seasonId?: SortOrderInput | SortOrder
    createdBy?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    galleryId?: SortOrderInput | SortOrder
    _count?: TournamentCountOrderByAggregateInput
    _avg?: TournamentAvgOrderByAggregateInput
    _max?: TournamentMaxOrderByAggregateInput
    _min?: TournamentMinOrderByAggregateInput
    _sum?: TournamentSumOrderByAggregateInput
  }

  export type TournamentScalarWhereWithAggregatesInput = {
    AND?: TournamentScalarWhereWithAggregatesInput | TournamentScalarWhereWithAggregatesInput[]
    OR?: TournamentScalarWhereWithAggregatesInput[]
    NOT?: TournamentScalarWhereWithAggregatesInput | TournamentScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Tournament"> | string
    name?: StringWithAggregatesFilter<"Tournament"> | string
    startDate?: DateTimeWithAggregatesFilter<"Tournament"> | Date | string
    fee?: IntNullableWithAggregatesFilter<"Tournament"> | number | null
    seasonId?: StringNullableWithAggregatesFilter<"Tournament"> | string | null
    createdBy?: StringNullableWithAggregatesFilter<"Tournament"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Tournament"> | Date | string
    galleryId?: StringNullableWithAggregatesFilter<"Tournament"> | string | null
  }

  export type PollVoteWhereInput = {
    AND?: PollVoteWhereInput | PollVoteWhereInput[]
    OR?: PollVoteWhereInput[]
    NOT?: PollVoteWhereInput | PollVoteWhereInput[]
    id?: StringFilter<"PollVote"> | string
    vote?: EnumVoteFilter<"PollVote"> | $Enums.Vote
    inOption?: StringFilter<"PollVote"> | string
    outOption?: StringFilter<"PollVote"> | string
    soloOption?: StringFilter<"PollVote"> | string
    startDate?: DateTimeFilter<"PollVote"> | Date | string
    endDate?: DateTimeFilter<"PollVote"> | Date | string
    playerId?: StringFilter<"PollVote"> | string
    tournamentId?: StringFilter<"PollVote"> | string
    createdAt?: DateTimeFilter<"PollVote"> | Date | string
    player?: XOR<PlayerScalarRelationFilter, PlayerWhereInput>
    tournament?: XOR<TournamentScalarRelationFilter, TournamentWhereInput>
  }

  export type PollVoteOrderByWithRelationInput = {
    id?: SortOrder
    vote?: SortOrder
    inOption?: SortOrder
    outOption?: SortOrder
    soloOption?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    playerId?: SortOrder
    tournamentId?: SortOrder
    createdAt?: SortOrder
    player?: PlayerOrderByWithRelationInput
    tournament?: TournamentOrderByWithRelationInput
  }

  export type PollVoteWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    playerId?: string
    AND?: PollVoteWhereInput | PollVoteWhereInput[]
    OR?: PollVoteWhereInput[]
    NOT?: PollVoteWhereInput | PollVoteWhereInput[]
    vote?: EnumVoteFilter<"PollVote"> | $Enums.Vote
    inOption?: StringFilter<"PollVote"> | string
    outOption?: StringFilter<"PollVote"> | string
    soloOption?: StringFilter<"PollVote"> | string
    startDate?: DateTimeFilter<"PollVote"> | Date | string
    endDate?: DateTimeFilter<"PollVote"> | Date | string
    tournamentId?: StringFilter<"PollVote"> | string
    createdAt?: DateTimeFilter<"PollVote"> | Date | string
    player?: XOR<PlayerScalarRelationFilter, PlayerWhereInput>
    tournament?: XOR<TournamentScalarRelationFilter, TournamentWhereInput>
  }, "id" | "playerId">

  export type PollVoteOrderByWithAggregationInput = {
    id?: SortOrder
    vote?: SortOrder
    inOption?: SortOrder
    outOption?: SortOrder
    soloOption?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    playerId?: SortOrder
    tournamentId?: SortOrder
    createdAt?: SortOrder
    _count?: PollVoteCountOrderByAggregateInput
    _max?: PollVoteMaxOrderByAggregateInput
    _min?: PollVoteMinOrderByAggregateInput
  }

  export type PollVoteScalarWhereWithAggregatesInput = {
    AND?: PollVoteScalarWhereWithAggregatesInput | PollVoteScalarWhereWithAggregatesInput[]
    OR?: PollVoteScalarWhereWithAggregatesInput[]
    NOT?: PollVoteScalarWhereWithAggregatesInput | PollVoteScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"PollVote"> | string
    vote?: EnumVoteWithAggregatesFilter<"PollVote"> | $Enums.Vote
    inOption?: StringWithAggregatesFilter<"PollVote"> | string
    outOption?: StringWithAggregatesFilter<"PollVote"> | string
    soloOption?: StringWithAggregatesFilter<"PollVote"> | string
    startDate?: DateTimeWithAggregatesFilter<"PollVote"> | Date | string
    endDate?: DateTimeWithAggregatesFilter<"PollVote"> | Date | string
    playerId?: StringWithAggregatesFilter<"PollVote"> | string
    tournamentId?: StringWithAggregatesFilter<"PollVote"> | string
    createdAt?: DateTimeWithAggregatesFilter<"PollVote"> | Date | string
  }

  export type TournamentWinnerWhereInput = {
    AND?: TournamentWinnerWhereInput | TournamentWinnerWhereInput[]
    OR?: TournamentWinnerWhereInput[]
    NOT?: TournamentWinnerWhereInput | TournamentWinnerWhereInput[]
    id?: StringFilter<"TournamentWinner"> | string
    playerId?: StringFilter<"TournamentWinner"> | string
    position?: IntFilter<"TournamentWinner"> | number
    tournamentId?: StringFilter<"TournamentWinner"> | string
    createdAt?: DateTimeFilter<"TournamentWinner"> | Date | string
    player?: XOR<PlayerScalarRelationFilter, PlayerWhereInput>
    tournament?: XOR<TournamentScalarRelationFilter, TournamentWhereInput>
  }

  export type TournamentWinnerOrderByWithRelationInput = {
    id?: SortOrder
    playerId?: SortOrder
    position?: SortOrder
    tournamentId?: SortOrder
    createdAt?: SortOrder
    player?: PlayerOrderByWithRelationInput
    tournament?: TournamentOrderByWithRelationInput
  }

  export type TournamentWinnerWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: TournamentWinnerWhereInput | TournamentWinnerWhereInput[]
    OR?: TournamentWinnerWhereInput[]
    NOT?: TournamentWinnerWhereInput | TournamentWinnerWhereInput[]
    playerId?: StringFilter<"TournamentWinner"> | string
    position?: IntFilter<"TournamentWinner"> | number
    tournamentId?: StringFilter<"TournamentWinner"> | string
    createdAt?: DateTimeFilter<"TournamentWinner"> | Date | string
    player?: XOR<PlayerScalarRelationFilter, PlayerWhereInput>
    tournament?: XOR<TournamentScalarRelationFilter, TournamentWhereInput>
  }, "id">

  export type TournamentWinnerOrderByWithAggregationInput = {
    id?: SortOrder
    playerId?: SortOrder
    position?: SortOrder
    tournamentId?: SortOrder
    createdAt?: SortOrder
    _count?: TournamentWinnerCountOrderByAggregateInput
    _avg?: TournamentWinnerAvgOrderByAggregateInput
    _max?: TournamentWinnerMaxOrderByAggregateInput
    _min?: TournamentWinnerMinOrderByAggregateInput
    _sum?: TournamentWinnerSumOrderByAggregateInput
  }

  export type TournamentWinnerScalarWhereWithAggregatesInput = {
    AND?: TournamentWinnerScalarWhereWithAggregatesInput | TournamentWinnerScalarWhereWithAggregatesInput[]
    OR?: TournamentWinnerScalarWhereWithAggregatesInput[]
    NOT?: TournamentWinnerScalarWhereWithAggregatesInput | TournamentWinnerScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"TournamentWinner"> | string
    playerId?: StringWithAggregatesFilter<"TournamentWinner"> | string
    position?: IntWithAggregatesFilter<"TournamentWinner"> | number
    tournamentId?: StringWithAggregatesFilter<"TournamentWinner"> | string
    createdAt?: DateTimeWithAggregatesFilter<"TournamentWinner"> | Date | string
  }

  export type MatchWhereInput = {
    AND?: MatchWhereInput | MatchWhereInput[]
    OR?: MatchWhereInput[]
    NOT?: MatchWhereInput | MatchWhereInput[]
    id?: StringFilter<"Match"> | string
    matchName?: StringFilter<"Match"> | string
    tournamentId?: StringFilter<"Match"> | string
    createdAt?: DateTimeFilter<"Match"> | Date | string
    Tournament?: XOR<TournamentScalarRelationFilter, TournamentWhereInput>
  }

  export type MatchOrderByWithRelationInput = {
    id?: SortOrder
    matchName?: SortOrder
    tournamentId?: SortOrder
    createdAt?: SortOrder
    Tournament?: TournamentOrderByWithRelationInput
  }

  export type MatchWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: MatchWhereInput | MatchWhereInput[]
    OR?: MatchWhereInput[]
    NOT?: MatchWhereInput | MatchWhereInput[]
    matchName?: StringFilter<"Match"> | string
    tournamentId?: StringFilter<"Match"> | string
    createdAt?: DateTimeFilter<"Match"> | Date | string
    Tournament?: XOR<TournamentScalarRelationFilter, TournamentWhereInput>
  }, "id">

  export type MatchOrderByWithAggregationInput = {
    id?: SortOrder
    matchName?: SortOrder
    tournamentId?: SortOrder
    createdAt?: SortOrder
    _count?: MatchCountOrderByAggregateInput
    _max?: MatchMaxOrderByAggregateInput
    _min?: MatchMinOrderByAggregateInput
  }

  export type MatchScalarWhereWithAggregatesInput = {
    AND?: MatchScalarWhereWithAggregatesInput | MatchScalarWhereWithAggregatesInput[]
    OR?: MatchScalarWhereWithAggregatesInput[]
    NOT?: MatchScalarWhereWithAggregatesInput | MatchScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Match"> | string
    matchName?: StringWithAggregatesFilter<"Match"> | string
    tournamentId?: StringWithAggregatesFilter<"Match"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Match"> | Date | string
  }

  export type WalletWhereInput = {
    AND?: WalletWhereInput | WalletWhereInput[]
    OR?: WalletWhereInput[]
    NOT?: WalletWhereInput | WalletWhereInput[]
    id?: StringFilter<"Wallet"> | string
    amount?: IntFilter<"Wallet"> | number
    createdAt?: DateTimeFilter<"Wallet"> | Date | string
    playerId?: StringNullableFilter<"Wallet"> | string | null
    userId?: StringFilter<"Wallet"> | string
    player?: XOR<PlayerNullableScalarRelationFilter, PlayerWhereInput> | null
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type WalletOrderByWithRelationInput = {
    id?: SortOrder
    amount?: SortOrder
    createdAt?: SortOrder
    playerId?: SortOrderInput | SortOrder
    userId?: SortOrder
    player?: PlayerOrderByWithRelationInput
    user?: UserOrderByWithRelationInput
  }

  export type WalletWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    playerId?: string
    userId?: string
    AND?: WalletWhereInput | WalletWhereInput[]
    OR?: WalletWhereInput[]
    NOT?: WalletWhereInput | WalletWhereInput[]
    amount?: IntFilter<"Wallet"> | number
    createdAt?: DateTimeFilter<"Wallet"> | Date | string
    player?: XOR<PlayerNullableScalarRelationFilter, PlayerWhereInput> | null
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "playerId" | "userId">

  export type WalletOrderByWithAggregationInput = {
    id?: SortOrder
    amount?: SortOrder
    createdAt?: SortOrder
    playerId?: SortOrderInput | SortOrder
    userId?: SortOrder
    _count?: WalletCountOrderByAggregateInput
    _avg?: WalletAvgOrderByAggregateInput
    _max?: WalletMaxOrderByAggregateInput
    _min?: WalletMinOrderByAggregateInput
    _sum?: WalletSumOrderByAggregateInput
  }

  export type WalletScalarWhereWithAggregatesInput = {
    AND?: WalletScalarWhereWithAggregatesInput | WalletScalarWhereWithAggregatesInput[]
    OR?: WalletScalarWhereWithAggregatesInput[]
    NOT?: WalletScalarWhereWithAggregatesInput | WalletScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Wallet"> | string
    amount?: IntWithAggregatesFilter<"Wallet"> | number
    createdAt?: DateTimeWithAggregatesFilter<"Wallet"> | Date | string
    playerId?: StringNullableWithAggregatesFilter<"Wallet"> | string | null
    userId?: StringWithAggregatesFilter<"Wallet"> | string
  }

  export type PlayerStatsWhereInput = {
    AND?: PlayerStatsWhereInput | PlayerStatsWhereInput[]
    OR?: PlayerStatsWhereInput[]
    NOT?: PlayerStatsWhereInput | PlayerStatsWhereInput[]
    id?: StringFilter<"PlayerStats"> | string
    playerId?: StringFilter<"PlayerStats"> | string
    matches?: IntFilter<"PlayerStats"> | number
    wins?: IntFilter<"PlayerStats"> | number
    deaths?: IntFilter<"PlayerStats"> | number
    kills?: IntFilter<"PlayerStats"> | number
    kd?: FloatFilter<"PlayerStats"> | number
    createdAt?: DateTimeFilter<"PlayerStats"> | Date | string
    player?: XOR<PlayerScalarRelationFilter, PlayerWhereInput>
  }

  export type PlayerStatsOrderByWithRelationInput = {
    id?: SortOrder
    playerId?: SortOrder
    matches?: SortOrder
    wins?: SortOrder
    deaths?: SortOrder
    kills?: SortOrder
    kd?: SortOrder
    createdAt?: SortOrder
    player?: PlayerOrderByWithRelationInput
  }

  export type PlayerStatsWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    playerId?: string
    AND?: PlayerStatsWhereInput | PlayerStatsWhereInput[]
    OR?: PlayerStatsWhereInput[]
    NOT?: PlayerStatsWhereInput | PlayerStatsWhereInput[]
    matches?: IntFilter<"PlayerStats"> | number
    wins?: IntFilter<"PlayerStats"> | number
    deaths?: IntFilter<"PlayerStats"> | number
    kills?: IntFilter<"PlayerStats"> | number
    kd?: FloatFilter<"PlayerStats"> | number
    createdAt?: DateTimeFilter<"PlayerStats"> | Date | string
    player?: XOR<PlayerScalarRelationFilter, PlayerWhereInput>
  }, "id" | "playerId">

  export type PlayerStatsOrderByWithAggregationInput = {
    id?: SortOrder
    playerId?: SortOrder
    matches?: SortOrder
    wins?: SortOrder
    deaths?: SortOrder
    kills?: SortOrder
    kd?: SortOrder
    createdAt?: SortOrder
    _count?: PlayerStatsCountOrderByAggregateInput
    _avg?: PlayerStatsAvgOrderByAggregateInput
    _max?: PlayerStatsMaxOrderByAggregateInput
    _min?: PlayerStatsMinOrderByAggregateInput
    _sum?: PlayerStatsSumOrderByAggregateInput
  }

  export type PlayerStatsScalarWhereWithAggregatesInput = {
    AND?: PlayerStatsScalarWhereWithAggregatesInput | PlayerStatsScalarWhereWithAggregatesInput[]
    OR?: PlayerStatsScalarWhereWithAggregatesInput[]
    NOT?: PlayerStatsScalarWhereWithAggregatesInput | PlayerStatsScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"PlayerStats"> | string
    playerId?: StringWithAggregatesFilter<"PlayerStats"> | string
    matches?: IntWithAggregatesFilter<"PlayerStats"> | number
    wins?: IntWithAggregatesFilter<"PlayerStats"> | number
    deaths?: IntWithAggregatesFilter<"PlayerStats"> | number
    kills?: IntWithAggregatesFilter<"PlayerStats"> | number
    kd?: FloatWithAggregatesFilter<"PlayerStats"> | number
    createdAt?: DateTimeWithAggregatesFilter<"PlayerStats"> | Date | string
  }

  export type TeamWhereInput = {
    AND?: TeamWhereInput | TeamWhereInput[]
    OR?: TeamWhereInput[]
    NOT?: TeamWhereInput | TeamWhereInput[]
    id?: StringFilter<"Team"> | string
    name?: StringFilter<"Team"> | string
    createdAt?: DateTimeFilter<"Team"> | Date | string
    teamNumber?: IntFilter<"Team"> | number
    playerStatsId?: StringNullableFilter<"Team"> | string | null
    tournamentId?: StringNullableFilter<"Team"> | string | null
    players?: PlayerListRelationFilter
    tournament?: XOR<TournamentNullableScalarRelationFilter, TournamentWhereInput> | null
  }

  export type TeamOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    createdAt?: SortOrder
    teamNumber?: SortOrder
    playerStatsId?: SortOrderInput | SortOrder
    tournamentId?: SortOrderInput | SortOrder
    players?: PlayerOrderByRelationAggregateInput
    tournament?: TournamentOrderByWithRelationInput
  }

  export type TeamWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: TeamWhereInput | TeamWhereInput[]
    OR?: TeamWhereInput[]
    NOT?: TeamWhereInput | TeamWhereInput[]
    name?: StringFilter<"Team"> | string
    createdAt?: DateTimeFilter<"Team"> | Date | string
    teamNumber?: IntFilter<"Team"> | number
    playerStatsId?: StringNullableFilter<"Team"> | string | null
    tournamentId?: StringNullableFilter<"Team"> | string | null
    players?: PlayerListRelationFilter
    tournament?: XOR<TournamentNullableScalarRelationFilter, TournamentWhereInput> | null
  }, "id">

  export type TeamOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    createdAt?: SortOrder
    teamNumber?: SortOrder
    playerStatsId?: SortOrderInput | SortOrder
    tournamentId?: SortOrderInput | SortOrder
    _count?: TeamCountOrderByAggregateInput
    _avg?: TeamAvgOrderByAggregateInput
    _max?: TeamMaxOrderByAggregateInput
    _min?: TeamMinOrderByAggregateInput
    _sum?: TeamSumOrderByAggregateInput
  }

  export type TeamScalarWhereWithAggregatesInput = {
    AND?: TeamScalarWhereWithAggregatesInput | TeamScalarWhereWithAggregatesInput[]
    OR?: TeamScalarWhereWithAggregatesInput[]
    NOT?: TeamScalarWhereWithAggregatesInput | TeamScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Team"> | string
    name?: StringWithAggregatesFilter<"Team"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Team"> | Date | string
    teamNumber?: IntWithAggregatesFilter<"Team"> | number
    playerStatsId?: StringNullableWithAggregatesFilter<"Team"> | string | null
    tournamentId?: StringNullableWithAggregatesFilter<"Team"> | string | null
  }

  export type KDStatsWhereInput = {
    AND?: KDStatsWhereInput | KDStatsWhereInput[]
    OR?: KDStatsWhereInput[]
    NOT?: KDStatsWhereInput | KDStatsWhereInput[]
    id?: StringFilter<"KDStats"> | string
    playerId?: StringFilter<"KDStats"> | string
    kd?: FloatFilter<"KDStats"> | number
  }

  export type KDStatsOrderByWithRelationInput = {
    id?: SortOrder
    playerId?: SortOrder
    kd?: SortOrder
  }

  export type KDStatsWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    playerId?: string
    AND?: KDStatsWhereInput | KDStatsWhereInput[]
    OR?: KDStatsWhereInput[]
    NOT?: KDStatsWhereInput | KDStatsWhereInput[]
    kd?: FloatFilter<"KDStats"> | number
  }, "id" | "playerId">

  export type KDStatsOrderByWithAggregationInput = {
    id?: SortOrder
    playerId?: SortOrder
    kd?: SortOrder
    _count?: KDStatsCountOrderByAggregateInput
    _avg?: KDStatsAvgOrderByAggregateInput
    _max?: KDStatsMaxOrderByAggregateInput
    _min?: KDStatsMinOrderByAggregateInput
    _sum?: KDStatsSumOrderByAggregateInput
  }

  export type KDStatsScalarWhereWithAggregatesInput = {
    AND?: KDStatsScalarWhereWithAggregatesInput | KDStatsScalarWhereWithAggregatesInput[]
    OR?: KDStatsScalarWhereWithAggregatesInput[]
    NOT?: KDStatsScalarWhereWithAggregatesInput | KDStatsScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"KDStats"> | string
    playerId?: StringWithAggregatesFilter<"KDStats"> | string
    kd?: FloatWithAggregatesFilter<"KDStats"> | number
  }

  export type UserCreateInput = {
    id?: string
    email?: string | null
    clerkId: string
    isEmailLinked?: boolean
    userName: string
    usernameLastChangeAt?: Date | string
    role?: $Enums.Role
    balance?: number
    isInternal?: boolean
    isVerified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    playerId?: string | null
    player?: PlayerCreateNestedOneWithoutUserInput
    tournament?: TournamentCreateNestedOneWithoutUserInput
    wallet?: WalletCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateInput = {
    id?: string
    email?: string | null
    clerkId: string
    isEmailLinked?: boolean
    userName: string
    usernameLastChangeAt?: Date | string
    role?: $Enums.Role
    balance?: number
    isInternal?: boolean
    isVerified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    playerId?: string | null
    tournamentId?: string | null
    player?: PlayerUncheckedCreateNestedOneWithoutUserInput
    wallet?: WalletUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    clerkId?: StringFieldUpdateOperationsInput | string
    isEmailLinked?: BoolFieldUpdateOperationsInput | boolean
    userName?: StringFieldUpdateOperationsInput | string
    usernameLastChangeAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    balance?: IntFieldUpdateOperationsInput | number
    isInternal?: BoolFieldUpdateOperationsInput | boolean
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    playerId?: NullableStringFieldUpdateOperationsInput | string | null
    player?: PlayerUpdateOneWithoutUserNestedInput
    tournament?: TournamentUpdateOneWithoutUserNestedInput
    wallet?: WalletUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    clerkId?: StringFieldUpdateOperationsInput | string
    isEmailLinked?: BoolFieldUpdateOperationsInput | boolean
    userName?: StringFieldUpdateOperationsInput | string
    usernameLastChangeAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    balance?: IntFieldUpdateOperationsInput | number
    isInternal?: BoolFieldUpdateOperationsInput | boolean
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    playerId?: NullableStringFieldUpdateOperationsInput | string | null
    tournamentId?: NullableStringFieldUpdateOperationsInput | string | null
    player?: PlayerUncheckedUpdateOneWithoutUserNestedInput
    wallet?: WalletUncheckedUpdateOneWithoutUserNestedInput
  }

  export type UserCreateManyInput = {
    id?: string
    email?: string | null
    clerkId: string
    isEmailLinked?: boolean
    userName: string
    usernameLastChangeAt?: Date | string
    role?: $Enums.Role
    balance?: number
    isInternal?: boolean
    isVerified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    playerId?: string | null
    tournamentId?: string | null
  }

  export type UserUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    clerkId?: StringFieldUpdateOperationsInput | string
    isEmailLinked?: BoolFieldUpdateOperationsInput | boolean
    userName?: StringFieldUpdateOperationsInput | string
    usernameLastChangeAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    balance?: IntFieldUpdateOperationsInput | number
    isInternal?: BoolFieldUpdateOperationsInput | boolean
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    playerId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type UserUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    clerkId?: StringFieldUpdateOperationsInput | string
    isEmailLinked?: BoolFieldUpdateOperationsInput | boolean
    userName?: StringFieldUpdateOperationsInput | string
    usernameLastChangeAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    balance?: IntFieldUpdateOperationsInput | number
    isInternal?: BoolFieldUpdateOperationsInput | boolean
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    playerId?: NullableStringFieldUpdateOperationsInput | string | null
    tournamentId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PlayerCreateInput = {
    id?: string
    isBanned?: boolean
    category?: $Enums.PlayerCategory
    gameScore?: GameScoreCreateNestedManyWithoutPlayerInput
    pollVote?: PollVoteCreateNestedOneWithoutPlayerInput
    user: UserCreateNestedOneWithoutPlayerInput
    tournamentWinner?: TournamentWinnerCreateNestedManyWithoutPlayerInput
    Wallet?: WalletCreateNestedOneWithoutPlayerInput
    playerStats?: PlayerStatsCreateNestedOneWithoutPlayerInput
    team?: TeamCreateNestedOneWithoutPlayersInput
    characterImage?: GalleryCreateNestedOneWithoutPlayerInput
  }

  export type PlayerUncheckedCreateInput = {
    id?: string
    isBanned?: boolean
    category?: $Enums.PlayerCategory
    userId: string
    teamId?: string | null
    characterImageId?: string | null
    gameScore?: GameScoreUncheckedCreateNestedManyWithoutPlayerInput
    pollVote?: PollVoteUncheckedCreateNestedOneWithoutPlayerInput
    tournamentWinner?: TournamentWinnerUncheckedCreateNestedManyWithoutPlayerInput
    Wallet?: WalletUncheckedCreateNestedOneWithoutPlayerInput
    playerStats?: PlayerStatsUncheckedCreateNestedOneWithoutPlayerInput
  }

  export type PlayerUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    category?: EnumPlayerCategoryFieldUpdateOperationsInput | $Enums.PlayerCategory
    gameScore?: GameScoreUpdateManyWithoutPlayerNestedInput
    pollVote?: PollVoteUpdateOneWithoutPlayerNestedInput
    user?: UserUpdateOneRequiredWithoutPlayerNestedInput
    tournamentWinner?: TournamentWinnerUpdateManyWithoutPlayerNestedInput
    Wallet?: WalletUpdateOneWithoutPlayerNestedInput
    playerStats?: PlayerStatsUpdateOneWithoutPlayerNestedInput
    team?: TeamUpdateOneWithoutPlayersNestedInput
    characterImage?: GalleryUpdateOneWithoutPlayerNestedInput
  }

  export type PlayerUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    category?: EnumPlayerCategoryFieldUpdateOperationsInput | $Enums.PlayerCategory
    userId?: StringFieldUpdateOperationsInput | string
    teamId?: NullableStringFieldUpdateOperationsInput | string | null
    characterImageId?: NullableStringFieldUpdateOperationsInput | string | null
    gameScore?: GameScoreUncheckedUpdateManyWithoutPlayerNestedInput
    pollVote?: PollVoteUncheckedUpdateOneWithoutPlayerNestedInput
    tournamentWinner?: TournamentWinnerUncheckedUpdateManyWithoutPlayerNestedInput
    Wallet?: WalletUncheckedUpdateOneWithoutPlayerNestedInput
    playerStats?: PlayerStatsUncheckedUpdateOneWithoutPlayerNestedInput
  }

  export type PlayerCreateManyInput = {
    id?: string
    isBanned?: boolean
    category?: $Enums.PlayerCategory
    userId: string
    teamId?: string | null
    characterImageId?: string | null
  }

  export type PlayerUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    category?: EnumPlayerCategoryFieldUpdateOperationsInput | $Enums.PlayerCategory
  }

  export type PlayerUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    category?: EnumPlayerCategoryFieldUpdateOperationsInput | $Enums.PlayerCategory
    userId?: StringFieldUpdateOperationsInput | string
    teamId?: NullableStringFieldUpdateOperationsInput | string | null
    characterImageId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type GameScoreCreateInput = {
    highScore: number
    lastPlayedAt: Date | string
    player: PlayerCreateNestedOneWithoutGameScoreInput
  }

  export type GameScoreUncheckedCreateInput = {
    highScore: number
    lastPlayedAt: Date | string
    playerId: string
  }

  export type GameScoreUpdateInput = {
    highScore?: IntFieldUpdateOperationsInput | number
    lastPlayedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    player?: PlayerUpdateOneRequiredWithoutGameScoreNestedInput
  }

  export type GameScoreUncheckedUpdateInput = {
    highScore?: IntFieldUpdateOperationsInput | number
    lastPlayedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    playerId?: StringFieldUpdateOperationsInput | string
  }

  export type GameScoreCreateManyInput = {
    highScore: number
    lastPlayedAt: Date | string
    playerId: string
  }

  export type GameScoreUpdateManyMutationInput = {
    highScore?: IntFieldUpdateOperationsInput | number
    lastPlayedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type GameScoreUncheckedUpdateManyInput = {
    highScore?: IntFieldUpdateOperationsInput | number
    lastPlayedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    playerId?: StringFieldUpdateOperationsInput | string
  }

  export type GalleryCreateInput = {
    id?: string
    imageId: string
    name: string
    path: string
    fullPath: string
    publicUrl: string
    isCharacterImg?: boolean
    playerId?: string | null
    player?: PlayerCreateNestedOneWithoutCharacterImageInput
    tournament?: TournamentCreateNestedManyWithoutGalleryInput
  }

  export type GalleryUncheckedCreateInput = {
    id?: string
    imageId: string
    name: string
    path: string
    fullPath: string
    publicUrl: string
    isCharacterImg?: boolean
    playerId?: string | null
    player?: PlayerUncheckedCreateNestedOneWithoutCharacterImageInput
    tournament?: TournamentUncheckedCreateNestedManyWithoutGalleryInput
  }

  export type GalleryUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    imageId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    path?: StringFieldUpdateOperationsInput | string
    fullPath?: StringFieldUpdateOperationsInput | string
    publicUrl?: StringFieldUpdateOperationsInput | string
    isCharacterImg?: BoolFieldUpdateOperationsInput | boolean
    playerId?: NullableStringFieldUpdateOperationsInput | string | null
    player?: PlayerUpdateOneWithoutCharacterImageNestedInput
    tournament?: TournamentUpdateManyWithoutGalleryNestedInput
  }

  export type GalleryUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    imageId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    path?: StringFieldUpdateOperationsInput | string
    fullPath?: StringFieldUpdateOperationsInput | string
    publicUrl?: StringFieldUpdateOperationsInput | string
    isCharacterImg?: BoolFieldUpdateOperationsInput | boolean
    playerId?: NullableStringFieldUpdateOperationsInput | string | null
    player?: PlayerUncheckedUpdateOneWithoutCharacterImageNestedInput
    tournament?: TournamentUncheckedUpdateManyWithoutGalleryNestedInput
  }

  export type GalleryCreateManyInput = {
    id?: string
    imageId: string
    name: string
    path: string
    fullPath: string
    publicUrl: string
    isCharacterImg?: boolean
    playerId?: string | null
  }

  export type GalleryUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    imageId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    path?: StringFieldUpdateOperationsInput | string
    fullPath?: StringFieldUpdateOperationsInput | string
    publicUrl?: StringFieldUpdateOperationsInput | string
    isCharacterImg?: BoolFieldUpdateOperationsInput | boolean
    playerId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type GalleryUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    imageId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    path?: StringFieldUpdateOperationsInput | string
    fullPath?: StringFieldUpdateOperationsInput | string
    publicUrl?: StringFieldUpdateOperationsInput | string
    isCharacterImg?: BoolFieldUpdateOperationsInput | boolean
    playerId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type SeasonCreateInput = {
    id?: string
    name: string
    description?: string | null
    startDate: Date | string
    endDate?: Date | string
    status?: $Enums.SeasonStatus
    createdBy: string
    createdAt?: Date | string
    tournament?: TournamentCreateNestedManyWithoutSeasonInput
  }

  export type SeasonUncheckedCreateInput = {
    id?: string
    name: string
    description?: string | null
    startDate: Date | string
    endDate?: Date | string
    status?: $Enums.SeasonStatus
    createdBy: string
    createdAt?: Date | string
    tournament?: TournamentUncheckedCreateNestedManyWithoutSeasonInput
  }

  export type SeasonUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: EnumSeasonStatusFieldUpdateOperationsInput | $Enums.SeasonStatus
    createdBy?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    tournament?: TournamentUpdateManyWithoutSeasonNestedInput
  }

  export type SeasonUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: EnumSeasonStatusFieldUpdateOperationsInput | $Enums.SeasonStatus
    createdBy?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    tournament?: TournamentUncheckedUpdateManyWithoutSeasonNestedInput
  }

  export type SeasonCreateManyInput = {
    id?: string
    name: string
    description?: string | null
    startDate: Date | string
    endDate?: Date | string
    status?: $Enums.SeasonStatus
    createdBy: string
    createdAt?: Date | string
  }

  export type SeasonUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: EnumSeasonStatusFieldUpdateOperationsInput | $Enums.SeasonStatus
    createdBy?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SeasonUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: EnumSeasonStatusFieldUpdateOperationsInput | $Enums.SeasonStatus
    createdBy?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TournamentCreateInput = {
    id?: string
    name: string
    startDate: Date | string
    fee?: number | null
    createdBy?: string | null
    createdAt?: Date | string
    team?: TeamCreateNestedManyWithoutTournamentInput
    user?: UserCreateNestedManyWithoutTournamentInput
    season?: SeasonCreateNestedOneWithoutTournamentInput
    tournamentWinner?: TournamentWinnerCreateNestedManyWithoutTournamentInput
    pollVote?: PollVoteCreateNestedManyWithoutTournamentInput
    match?: MatchCreateNestedManyWithoutTournamentInput
    gallery?: GalleryCreateNestedOneWithoutTournamentInput
  }

  export type TournamentUncheckedCreateInput = {
    id?: string
    name: string
    startDate: Date | string
    fee?: number | null
    seasonId?: string | null
    createdBy?: string | null
    createdAt?: Date | string
    galleryId?: string | null
    team?: TeamUncheckedCreateNestedManyWithoutTournamentInput
    user?: UserUncheckedCreateNestedManyWithoutTournamentInput
    tournamentWinner?: TournamentWinnerUncheckedCreateNestedManyWithoutTournamentInput
    pollVote?: PollVoteUncheckedCreateNestedManyWithoutTournamentInput
    match?: MatchUncheckedCreateNestedManyWithoutTournamentInput
  }

  export type TournamentUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    fee?: NullableIntFieldUpdateOperationsInput | number | null
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    team?: TeamUpdateManyWithoutTournamentNestedInput
    user?: UserUpdateManyWithoutTournamentNestedInput
    season?: SeasonUpdateOneWithoutTournamentNestedInput
    tournamentWinner?: TournamentWinnerUpdateManyWithoutTournamentNestedInput
    pollVote?: PollVoteUpdateManyWithoutTournamentNestedInput
    match?: MatchUpdateManyWithoutTournamentNestedInput
    gallery?: GalleryUpdateOneWithoutTournamentNestedInput
  }

  export type TournamentUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    fee?: NullableIntFieldUpdateOperationsInput | number | null
    seasonId?: NullableStringFieldUpdateOperationsInput | string | null
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    galleryId?: NullableStringFieldUpdateOperationsInput | string | null
    team?: TeamUncheckedUpdateManyWithoutTournamentNestedInput
    user?: UserUncheckedUpdateManyWithoutTournamentNestedInput
    tournamentWinner?: TournamentWinnerUncheckedUpdateManyWithoutTournamentNestedInput
    pollVote?: PollVoteUncheckedUpdateManyWithoutTournamentNestedInput
    match?: MatchUncheckedUpdateManyWithoutTournamentNestedInput
  }

  export type TournamentCreateManyInput = {
    id?: string
    name: string
    startDate: Date | string
    fee?: number | null
    seasonId?: string | null
    createdBy?: string | null
    createdAt?: Date | string
    galleryId?: string | null
  }

  export type TournamentUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    fee?: NullableIntFieldUpdateOperationsInput | number | null
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TournamentUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    fee?: NullableIntFieldUpdateOperationsInput | number | null
    seasonId?: NullableStringFieldUpdateOperationsInput | string | null
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    galleryId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PollVoteCreateInput = {
    id?: string
    vote: $Enums.Vote
    inOption: string
    outOption: string
    soloOption: string
    startDate: Date | string
    endDate: Date | string
    createdAt?: Date | string
    player: PlayerCreateNestedOneWithoutPollVoteInput
    tournament: TournamentCreateNestedOneWithoutPollVoteInput
  }

  export type PollVoteUncheckedCreateInput = {
    id?: string
    vote: $Enums.Vote
    inOption: string
    outOption: string
    soloOption: string
    startDate: Date | string
    endDate: Date | string
    playerId: string
    tournamentId: string
    createdAt?: Date | string
  }

  export type PollVoteUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    vote?: EnumVoteFieldUpdateOperationsInput | $Enums.Vote
    inOption?: StringFieldUpdateOperationsInput | string
    outOption?: StringFieldUpdateOperationsInput | string
    soloOption?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    player?: PlayerUpdateOneRequiredWithoutPollVoteNestedInput
    tournament?: TournamentUpdateOneRequiredWithoutPollVoteNestedInput
  }

  export type PollVoteUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    vote?: EnumVoteFieldUpdateOperationsInput | $Enums.Vote
    inOption?: StringFieldUpdateOperationsInput | string
    outOption?: StringFieldUpdateOperationsInput | string
    soloOption?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    playerId?: StringFieldUpdateOperationsInput | string
    tournamentId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PollVoteCreateManyInput = {
    id?: string
    vote: $Enums.Vote
    inOption: string
    outOption: string
    soloOption: string
    startDate: Date | string
    endDate: Date | string
    playerId: string
    tournamentId: string
    createdAt?: Date | string
  }

  export type PollVoteUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    vote?: EnumVoteFieldUpdateOperationsInput | $Enums.Vote
    inOption?: StringFieldUpdateOperationsInput | string
    outOption?: StringFieldUpdateOperationsInput | string
    soloOption?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PollVoteUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    vote?: EnumVoteFieldUpdateOperationsInput | $Enums.Vote
    inOption?: StringFieldUpdateOperationsInput | string
    outOption?: StringFieldUpdateOperationsInput | string
    soloOption?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    playerId?: StringFieldUpdateOperationsInput | string
    tournamentId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TournamentWinnerCreateInput = {
    id?: string
    position: number
    createdAt?: Date | string
    player: PlayerCreateNestedOneWithoutTournamentWinnerInput
    tournament: TournamentCreateNestedOneWithoutTournamentWinnerInput
  }

  export type TournamentWinnerUncheckedCreateInput = {
    id?: string
    playerId: string
    position: number
    tournamentId: string
    createdAt?: Date | string
  }

  export type TournamentWinnerUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    player?: PlayerUpdateOneRequiredWithoutTournamentWinnerNestedInput
    tournament?: TournamentUpdateOneRequiredWithoutTournamentWinnerNestedInput
  }

  export type TournamentWinnerUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    playerId?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
    tournamentId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TournamentWinnerCreateManyInput = {
    id?: string
    playerId: string
    position: number
    tournamentId: string
    createdAt?: Date | string
  }

  export type TournamentWinnerUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TournamentWinnerUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    playerId?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
    tournamentId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MatchCreateInput = {
    id?: string
    matchName: string
    createdAt?: Date | string
    Tournament: TournamentCreateNestedOneWithoutMatchInput
  }

  export type MatchUncheckedCreateInput = {
    id?: string
    matchName: string
    tournamentId: string
    createdAt?: Date | string
  }

  export type MatchUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    matchName?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    Tournament?: TournamentUpdateOneRequiredWithoutMatchNestedInput
  }

  export type MatchUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    matchName?: StringFieldUpdateOperationsInput | string
    tournamentId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MatchCreateManyInput = {
    id?: string
    matchName: string
    tournamentId: string
    createdAt?: Date | string
  }

  export type MatchUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    matchName?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MatchUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    matchName?: StringFieldUpdateOperationsInput | string
    tournamentId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WalletCreateInput = {
    id?: string
    amount: number
    createdAt?: Date | string
    player?: PlayerCreateNestedOneWithoutWalletInput
    user: UserCreateNestedOneWithoutWalletInput
  }

  export type WalletUncheckedCreateInput = {
    id?: string
    amount: number
    createdAt?: Date | string
    playerId?: string | null
    userId: string
  }

  export type WalletUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    amount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    player?: PlayerUpdateOneWithoutWalletNestedInput
    user?: UserUpdateOneRequiredWithoutWalletNestedInput
  }

  export type WalletUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    amount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    playerId?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type WalletCreateManyInput = {
    id?: string
    amount: number
    createdAt?: Date | string
    playerId?: string | null
    userId: string
  }

  export type WalletUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    amount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WalletUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    amount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    playerId?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type PlayerStatsCreateInput = {
    id?: string
    matches: number
    wins: number
    deaths: number
    kills: number
    kd: number
    createdAt?: Date | string
    player: PlayerCreateNestedOneWithoutPlayerStatsInput
  }

  export type PlayerStatsUncheckedCreateInput = {
    id?: string
    playerId: string
    matches: number
    wins: number
    deaths: number
    kills: number
    kd: number
    createdAt?: Date | string
  }

  export type PlayerStatsUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    matches?: IntFieldUpdateOperationsInput | number
    wins?: IntFieldUpdateOperationsInput | number
    deaths?: IntFieldUpdateOperationsInput | number
    kills?: IntFieldUpdateOperationsInput | number
    kd?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    player?: PlayerUpdateOneRequiredWithoutPlayerStatsNestedInput
  }

  export type PlayerStatsUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    playerId?: StringFieldUpdateOperationsInput | string
    matches?: IntFieldUpdateOperationsInput | number
    wins?: IntFieldUpdateOperationsInput | number
    deaths?: IntFieldUpdateOperationsInput | number
    kills?: IntFieldUpdateOperationsInput | number
    kd?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PlayerStatsCreateManyInput = {
    id?: string
    playerId: string
    matches: number
    wins: number
    deaths: number
    kills: number
    kd: number
    createdAt?: Date | string
  }

  export type PlayerStatsUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    matches?: IntFieldUpdateOperationsInput | number
    wins?: IntFieldUpdateOperationsInput | number
    deaths?: IntFieldUpdateOperationsInput | number
    kills?: IntFieldUpdateOperationsInput | number
    kd?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PlayerStatsUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    playerId?: StringFieldUpdateOperationsInput | string
    matches?: IntFieldUpdateOperationsInput | number
    wins?: IntFieldUpdateOperationsInput | number
    deaths?: IntFieldUpdateOperationsInput | number
    kills?: IntFieldUpdateOperationsInput | number
    kd?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TeamCreateInput = {
    id?: string
    name: string
    createdAt?: Date | string
    teamNumber: number
    playerStatsId?: string | null
    players?: PlayerCreateNestedManyWithoutTeamInput
    tournament?: TournamentCreateNestedOneWithoutTeamInput
  }

  export type TeamUncheckedCreateInput = {
    id?: string
    name: string
    createdAt?: Date | string
    teamNumber: number
    playerStatsId?: string | null
    tournamentId?: string | null
    players?: PlayerUncheckedCreateNestedManyWithoutTeamInput
  }

  export type TeamUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    teamNumber?: IntFieldUpdateOperationsInput | number
    playerStatsId?: NullableStringFieldUpdateOperationsInput | string | null
    players?: PlayerUpdateManyWithoutTeamNestedInput
    tournament?: TournamentUpdateOneWithoutTeamNestedInput
  }

  export type TeamUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    teamNumber?: IntFieldUpdateOperationsInput | number
    playerStatsId?: NullableStringFieldUpdateOperationsInput | string | null
    tournamentId?: NullableStringFieldUpdateOperationsInput | string | null
    players?: PlayerUncheckedUpdateManyWithoutTeamNestedInput
  }

  export type TeamCreateManyInput = {
    id?: string
    name: string
    createdAt?: Date | string
    teamNumber: number
    playerStatsId?: string | null
    tournamentId?: string | null
  }

  export type TeamUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    teamNumber?: IntFieldUpdateOperationsInput | number
    playerStatsId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type TeamUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    teamNumber?: IntFieldUpdateOperationsInput | number
    playerStatsId?: NullableStringFieldUpdateOperationsInput | string | null
    tournamentId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type KDStatsCreateInput = {
    id?: string
    playerId: string
    kd: number
  }

  export type KDStatsUncheckedCreateInput = {
    id?: string
    playerId: string
    kd: number
  }

  export type KDStatsUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    playerId?: StringFieldUpdateOperationsInput | string
    kd?: FloatFieldUpdateOperationsInput | number
  }

  export type KDStatsUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    playerId?: StringFieldUpdateOperationsInput | string
    kd?: FloatFieldUpdateOperationsInput | number
  }

  export type KDStatsCreateManyInput = {
    id?: string
    playerId: string
    kd: number
  }

  export type KDStatsUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    playerId?: StringFieldUpdateOperationsInput | string
    kd?: FloatFieldUpdateOperationsInput | number
  }

  export type KDStatsUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    playerId?: StringFieldUpdateOperationsInput | string
    kd?: FloatFieldUpdateOperationsInput | number
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type EnumRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleFilter<$PrismaModel> | $Enums.Role
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type PlayerNullableScalarRelationFilter = {
    is?: PlayerWhereInput | null
    isNot?: PlayerWhereInput | null
  }

  export type TournamentNullableScalarRelationFilter = {
    is?: TournamentWhereInput | null
    isNot?: TournamentWhereInput | null
  }

  export type WalletNullableScalarRelationFilter = {
    is?: WalletWhereInput | null
    isNot?: WalletWhereInput | null
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    clerkId?: SortOrder
    isEmailLinked?: SortOrder
    userName?: SortOrder
    usernameLastChangeAt?: SortOrder
    role?: SortOrder
    balance?: SortOrder
    isInternal?: SortOrder
    isVerified?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    playerId?: SortOrder
    tournamentId?: SortOrder
  }

  export type UserAvgOrderByAggregateInput = {
    balance?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    clerkId?: SortOrder
    isEmailLinked?: SortOrder
    userName?: SortOrder
    usernameLastChangeAt?: SortOrder
    role?: SortOrder
    balance?: SortOrder
    isInternal?: SortOrder
    isVerified?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    playerId?: SortOrder
    tournamentId?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    clerkId?: SortOrder
    isEmailLinked?: SortOrder
    userName?: SortOrder
    usernameLastChangeAt?: SortOrder
    role?: SortOrder
    balance?: SortOrder
    isInternal?: SortOrder
    isVerified?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    playerId?: SortOrder
    tournamentId?: SortOrder
  }

  export type UserSumOrderByAggregateInput = {
    balance?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type EnumRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleWithAggregatesFilter<$PrismaModel> | $Enums.Role
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRoleFilter<$PrismaModel>
    _max?: NestedEnumRoleFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type EnumPlayerCategoryFilter<$PrismaModel = never> = {
    equals?: $Enums.PlayerCategory | EnumPlayerCategoryFieldRefInput<$PrismaModel>
    in?: $Enums.PlayerCategory[] | ListEnumPlayerCategoryFieldRefInput<$PrismaModel>
    notIn?: $Enums.PlayerCategory[] | ListEnumPlayerCategoryFieldRefInput<$PrismaModel>
    not?: NestedEnumPlayerCategoryFilter<$PrismaModel> | $Enums.PlayerCategory
  }

  export type GameScoreListRelationFilter = {
    every?: GameScoreWhereInput
    some?: GameScoreWhereInput
    none?: GameScoreWhereInput
  }

  export type PollVoteNullableScalarRelationFilter = {
    is?: PollVoteWhereInput | null
    isNot?: PollVoteWhereInput | null
  }

  export type UserScalarRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type TournamentWinnerListRelationFilter = {
    every?: TournamentWinnerWhereInput
    some?: TournamentWinnerWhereInput
    none?: TournamentWinnerWhereInput
  }

  export type PlayerStatsNullableScalarRelationFilter = {
    is?: PlayerStatsWhereInput | null
    isNot?: PlayerStatsWhereInput | null
  }

  export type TeamNullableScalarRelationFilter = {
    is?: TeamWhereInput | null
    isNot?: TeamWhereInput | null
  }

  export type GalleryNullableScalarRelationFilter = {
    is?: GalleryWhereInput | null
    isNot?: GalleryWhereInput | null
  }

  export type GameScoreOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TournamentWinnerOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type PlayerCountOrderByAggregateInput = {
    id?: SortOrder
    isBanned?: SortOrder
    category?: SortOrder
    userId?: SortOrder
    teamId?: SortOrder
    characterImageId?: SortOrder
  }

  export type PlayerMaxOrderByAggregateInput = {
    id?: SortOrder
    isBanned?: SortOrder
    category?: SortOrder
    userId?: SortOrder
    teamId?: SortOrder
    characterImageId?: SortOrder
  }

  export type PlayerMinOrderByAggregateInput = {
    id?: SortOrder
    isBanned?: SortOrder
    category?: SortOrder
    userId?: SortOrder
    teamId?: SortOrder
    characterImageId?: SortOrder
  }

  export type EnumPlayerCategoryWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PlayerCategory | EnumPlayerCategoryFieldRefInput<$PrismaModel>
    in?: $Enums.PlayerCategory[] | ListEnumPlayerCategoryFieldRefInput<$PrismaModel>
    notIn?: $Enums.PlayerCategory[] | ListEnumPlayerCategoryFieldRefInput<$PrismaModel>
    not?: NestedEnumPlayerCategoryWithAggregatesFilter<$PrismaModel> | $Enums.PlayerCategory
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPlayerCategoryFilter<$PrismaModel>
    _max?: NestedEnumPlayerCategoryFilter<$PrismaModel>
  }

  export type PlayerScalarRelationFilter = {
    is?: PlayerWhereInput
    isNot?: PlayerWhereInput
  }

  export type GameScoreCountOrderByAggregateInput = {
    highScore?: SortOrder
    lastPlayedAt?: SortOrder
    playerId?: SortOrder
  }

  export type GameScoreAvgOrderByAggregateInput = {
    highScore?: SortOrder
  }

  export type GameScoreMaxOrderByAggregateInput = {
    highScore?: SortOrder
    lastPlayedAt?: SortOrder
    playerId?: SortOrder
  }

  export type GameScoreMinOrderByAggregateInput = {
    highScore?: SortOrder
    lastPlayedAt?: SortOrder
    playerId?: SortOrder
  }

  export type GameScoreSumOrderByAggregateInput = {
    highScore?: SortOrder
  }

  export type TournamentListRelationFilter = {
    every?: TournamentWhereInput
    some?: TournamentWhereInput
    none?: TournamentWhereInput
  }

  export type TournamentOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type GalleryCountOrderByAggregateInput = {
    id?: SortOrder
    imageId?: SortOrder
    name?: SortOrder
    path?: SortOrder
    fullPath?: SortOrder
    publicUrl?: SortOrder
    isCharacterImg?: SortOrder
    playerId?: SortOrder
  }

  export type GalleryMaxOrderByAggregateInput = {
    id?: SortOrder
    imageId?: SortOrder
    name?: SortOrder
    path?: SortOrder
    fullPath?: SortOrder
    publicUrl?: SortOrder
    isCharacterImg?: SortOrder
    playerId?: SortOrder
  }

  export type GalleryMinOrderByAggregateInput = {
    id?: SortOrder
    imageId?: SortOrder
    name?: SortOrder
    path?: SortOrder
    fullPath?: SortOrder
    publicUrl?: SortOrder
    isCharacterImg?: SortOrder
    playerId?: SortOrder
  }

  export type EnumSeasonStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.SeasonStatus | EnumSeasonStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SeasonStatus[] | ListEnumSeasonStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SeasonStatus[] | ListEnumSeasonStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSeasonStatusFilter<$PrismaModel> | $Enums.SeasonStatus
  }

  export type SeasonIdStatusCompoundUniqueInput = {
    id: string
    status: $Enums.SeasonStatus
  }

  export type SeasonCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    status?: SortOrder
    createdBy?: SortOrder
    createdAt?: SortOrder
  }

  export type SeasonMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    status?: SortOrder
    createdBy?: SortOrder
    createdAt?: SortOrder
  }

  export type SeasonMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    status?: SortOrder
    createdBy?: SortOrder
    createdAt?: SortOrder
  }

  export type EnumSeasonStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SeasonStatus | EnumSeasonStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SeasonStatus[] | ListEnumSeasonStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SeasonStatus[] | ListEnumSeasonStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSeasonStatusWithAggregatesFilter<$PrismaModel> | $Enums.SeasonStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSeasonStatusFilter<$PrismaModel>
    _max?: NestedEnumSeasonStatusFilter<$PrismaModel>
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type TeamListRelationFilter = {
    every?: TeamWhereInput
    some?: TeamWhereInput
    none?: TeamWhereInput
  }

  export type UserListRelationFilter = {
    every?: UserWhereInput
    some?: UserWhereInput
    none?: UserWhereInput
  }

  export type SeasonNullableScalarRelationFilter = {
    is?: SeasonWhereInput | null
    isNot?: SeasonWhereInput | null
  }

  export type PollVoteListRelationFilter = {
    every?: PollVoteWhereInput
    some?: PollVoteWhereInput
    none?: PollVoteWhereInput
  }

  export type MatchListRelationFilter = {
    every?: MatchWhereInput
    some?: MatchWhereInput
    none?: MatchWhereInput
  }

  export type TeamOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type PollVoteOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type MatchOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TournamentCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    startDate?: SortOrder
    fee?: SortOrder
    seasonId?: SortOrder
    createdBy?: SortOrder
    createdAt?: SortOrder
    galleryId?: SortOrder
  }

  export type TournamentAvgOrderByAggregateInput = {
    fee?: SortOrder
  }

  export type TournamentMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    startDate?: SortOrder
    fee?: SortOrder
    seasonId?: SortOrder
    createdBy?: SortOrder
    createdAt?: SortOrder
    galleryId?: SortOrder
  }

  export type TournamentMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    startDate?: SortOrder
    fee?: SortOrder
    seasonId?: SortOrder
    createdBy?: SortOrder
    createdAt?: SortOrder
    galleryId?: SortOrder
  }

  export type TournamentSumOrderByAggregateInput = {
    fee?: SortOrder
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type EnumVoteFilter<$PrismaModel = never> = {
    equals?: $Enums.Vote | EnumVoteFieldRefInput<$PrismaModel>
    in?: $Enums.Vote[] | ListEnumVoteFieldRefInput<$PrismaModel>
    notIn?: $Enums.Vote[] | ListEnumVoteFieldRefInput<$PrismaModel>
    not?: NestedEnumVoteFilter<$PrismaModel> | $Enums.Vote
  }

  export type TournamentScalarRelationFilter = {
    is?: TournamentWhereInput
    isNot?: TournamentWhereInput
  }

  export type PollVoteCountOrderByAggregateInput = {
    id?: SortOrder
    vote?: SortOrder
    inOption?: SortOrder
    outOption?: SortOrder
    soloOption?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    playerId?: SortOrder
    tournamentId?: SortOrder
    createdAt?: SortOrder
  }

  export type PollVoteMaxOrderByAggregateInput = {
    id?: SortOrder
    vote?: SortOrder
    inOption?: SortOrder
    outOption?: SortOrder
    soloOption?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    playerId?: SortOrder
    tournamentId?: SortOrder
    createdAt?: SortOrder
  }

  export type PollVoteMinOrderByAggregateInput = {
    id?: SortOrder
    vote?: SortOrder
    inOption?: SortOrder
    outOption?: SortOrder
    soloOption?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    playerId?: SortOrder
    tournamentId?: SortOrder
    createdAt?: SortOrder
  }

  export type EnumVoteWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Vote | EnumVoteFieldRefInput<$PrismaModel>
    in?: $Enums.Vote[] | ListEnumVoteFieldRefInput<$PrismaModel>
    notIn?: $Enums.Vote[] | ListEnumVoteFieldRefInput<$PrismaModel>
    not?: NestedEnumVoteWithAggregatesFilter<$PrismaModel> | $Enums.Vote
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumVoteFilter<$PrismaModel>
    _max?: NestedEnumVoteFilter<$PrismaModel>
  }

  export type TournamentWinnerCountOrderByAggregateInput = {
    id?: SortOrder
    playerId?: SortOrder
    position?: SortOrder
    tournamentId?: SortOrder
    createdAt?: SortOrder
  }

  export type TournamentWinnerAvgOrderByAggregateInput = {
    position?: SortOrder
  }

  export type TournamentWinnerMaxOrderByAggregateInput = {
    id?: SortOrder
    playerId?: SortOrder
    position?: SortOrder
    tournamentId?: SortOrder
    createdAt?: SortOrder
  }

  export type TournamentWinnerMinOrderByAggregateInput = {
    id?: SortOrder
    playerId?: SortOrder
    position?: SortOrder
    tournamentId?: SortOrder
    createdAt?: SortOrder
  }

  export type TournamentWinnerSumOrderByAggregateInput = {
    position?: SortOrder
  }

  export type MatchCountOrderByAggregateInput = {
    id?: SortOrder
    matchName?: SortOrder
    tournamentId?: SortOrder
    createdAt?: SortOrder
  }

  export type MatchMaxOrderByAggregateInput = {
    id?: SortOrder
    matchName?: SortOrder
    tournamentId?: SortOrder
    createdAt?: SortOrder
  }

  export type MatchMinOrderByAggregateInput = {
    id?: SortOrder
    matchName?: SortOrder
    tournamentId?: SortOrder
    createdAt?: SortOrder
  }

  export type WalletCountOrderByAggregateInput = {
    id?: SortOrder
    amount?: SortOrder
    createdAt?: SortOrder
    playerId?: SortOrder
    userId?: SortOrder
  }

  export type WalletAvgOrderByAggregateInput = {
    amount?: SortOrder
  }

  export type WalletMaxOrderByAggregateInput = {
    id?: SortOrder
    amount?: SortOrder
    createdAt?: SortOrder
    playerId?: SortOrder
    userId?: SortOrder
  }

  export type WalletMinOrderByAggregateInput = {
    id?: SortOrder
    amount?: SortOrder
    createdAt?: SortOrder
    playerId?: SortOrder
    userId?: SortOrder
  }

  export type WalletSumOrderByAggregateInput = {
    amount?: SortOrder
  }

  export type FloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type PlayerStatsCountOrderByAggregateInput = {
    id?: SortOrder
    playerId?: SortOrder
    matches?: SortOrder
    wins?: SortOrder
    deaths?: SortOrder
    kills?: SortOrder
    kd?: SortOrder
    createdAt?: SortOrder
  }

  export type PlayerStatsAvgOrderByAggregateInput = {
    matches?: SortOrder
    wins?: SortOrder
    deaths?: SortOrder
    kills?: SortOrder
    kd?: SortOrder
  }

  export type PlayerStatsMaxOrderByAggregateInput = {
    id?: SortOrder
    playerId?: SortOrder
    matches?: SortOrder
    wins?: SortOrder
    deaths?: SortOrder
    kills?: SortOrder
    kd?: SortOrder
    createdAt?: SortOrder
  }

  export type PlayerStatsMinOrderByAggregateInput = {
    id?: SortOrder
    playerId?: SortOrder
    matches?: SortOrder
    wins?: SortOrder
    deaths?: SortOrder
    kills?: SortOrder
    kd?: SortOrder
    createdAt?: SortOrder
  }

  export type PlayerStatsSumOrderByAggregateInput = {
    matches?: SortOrder
    wins?: SortOrder
    deaths?: SortOrder
    kills?: SortOrder
    kd?: SortOrder
  }

  export type FloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type PlayerListRelationFilter = {
    every?: PlayerWhereInput
    some?: PlayerWhereInput
    none?: PlayerWhereInput
  }

  export type PlayerOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TeamCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    createdAt?: SortOrder
    teamNumber?: SortOrder
    playerStatsId?: SortOrder
    tournamentId?: SortOrder
  }

  export type TeamAvgOrderByAggregateInput = {
    teamNumber?: SortOrder
  }

  export type TeamMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    createdAt?: SortOrder
    teamNumber?: SortOrder
    playerStatsId?: SortOrder
    tournamentId?: SortOrder
  }

  export type TeamMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    createdAt?: SortOrder
    teamNumber?: SortOrder
    playerStatsId?: SortOrder
    tournamentId?: SortOrder
  }

  export type TeamSumOrderByAggregateInput = {
    teamNumber?: SortOrder
  }

  export type KDStatsCountOrderByAggregateInput = {
    id?: SortOrder
    playerId?: SortOrder
    kd?: SortOrder
  }

  export type KDStatsAvgOrderByAggregateInput = {
    kd?: SortOrder
  }

  export type KDStatsMaxOrderByAggregateInput = {
    id?: SortOrder
    playerId?: SortOrder
    kd?: SortOrder
  }

  export type KDStatsMinOrderByAggregateInput = {
    id?: SortOrder
    playerId?: SortOrder
    kd?: SortOrder
  }

  export type KDStatsSumOrderByAggregateInput = {
    kd?: SortOrder
  }

  export type PlayerCreateNestedOneWithoutUserInput = {
    create?: XOR<PlayerCreateWithoutUserInput, PlayerUncheckedCreateWithoutUserInput>
    connectOrCreate?: PlayerCreateOrConnectWithoutUserInput
    connect?: PlayerWhereUniqueInput
  }

  export type TournamentCreateNestedOneWithoutUserInput = {
    create?: XOR<TournamentCreateWithoutUserInput, TournamentUncheckedCreateWithoutUserInput>
    connectOrCreate?: TournamentCreateOrConnectWithoutUserInput
    connect?: TournamentWhereUniqueInput
  }

  export type WalletCreateNestedOneWithoutUserInput = {
    create?: XOR<WalletCreateWithoutUserInput, WalletUncheckedCreateWithoutUserInput>
    connectOrCreate?: WalletCreateOrConnectWithoutUserInput
    connect?: WalletWhereUniqueInput
  }

  export type PlayerUncheckedCreateNestedOneWithoutUserInput = {
    create?: XOR<PlayerCreateWithoutUserInput, PlayerUncheckedCreateWithoutUserInput>
    connectOrCreate?: PlayerCreateOrConnectWithoutUserInput
    connect?: PlayerWhereUniqueInput
  }

  export type WalletUncheckedCreateNestedOneWithoutUserInput = {
    create?: XOR<WalletCreateWithoutUserInput, WalletUncheckedCreateWithoutUserInput>
    connectOrCreate?: WalletCreateOrConnectWithoutUserInput
    connect?: WalletWhereUniqueInput
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type EnumRoleFieldUpdateOperationsInput = {
    set?: $Enums.Role
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type PlayerUpdateOneWithoutUserNestedInput = {
    create?: XOR<PlayerCreateWithoutUserInput, PlayerUncheckedCreateWithoutUserInput>
    connectOrCreate?: PlayerCreateOrConnectWithoutUserInput
    upsert?: PlayerUpsertWithoutUserInput
    disconnect?: PlayerWhereInput | boolean
    delete?: PlayerWhereInput | boolean
    connect?: PlayerWhereUniqueInput
    update?: XOR<XOR<PlayerUpdateToOneWithWhereWithoutUserInput, PlayerUpdateWithoutUserInput>, PlayerUncheckedUpdateWithoutUserInput>
  }

  export type TournamentUpdateOneWithoutUserNestedInput = {
    create?: XOR<TournamentCreateWithoutUserInput, TournamentUncheckedCreateWithoutUserInput>
    connectOrCreate?: TournamentCreateOrConnectWithoutUserInput
    upsert?: TournamentUpsertWithoutUserInput
    disconnect?: TournamentWhereInput | boolean
    delete?: TournamentWhereInput | boolean
    connect?: TournamentWhereUniqueInput
    update?: XOR<XOR<TournamentUpdateToOneWithWhereWithoutUserInput, TournamentUpdateWithoutUserInput>, TournamentUncheckedUpdateWithoutUserInput>
  }

  export type WalletUpdateOneWithoutUserNestedInput = {
    create?: XOR<WalletCreateWithoutUserInput, WalletUncheckedCreateWithoutUserInput>
    connectOrCreate?: WalletCreateOrConnectWithoutUserInput
    upsert?: WalletUpsertWithoutUserInput
    disconnect?: WalletWhereInput | boolean
    delete?: WalletWhereInput | boolean
    connect?: WalletWhereUniqueInput
    update?: XOR<XOR<WalletUpdateToOneWithWhereWithoutUserInput, WalletUpdateWithoutUserInput>, WalletUncheckedUpdateWithoutUserInput>
  }

  export type PlayerUncheckedUpdateOneWithoutUserNestedInput = {
    create?: XOR<PlayerCreateWithoutUserInput, PlayerUncheckedCreateWithoutUserInput>
    connectOrCreate?: PlayerCreateOrConnectWithoutUserInput
    upsert?: PlayerUpsertWithoutUserInput
    disconnect?: PlayerWhereInput | boolean
    delete?: PlayerWhereInput | boolean
    connect?: PlayerWhereUniqueInput
    update?: XOR<XOR<PlayerUpdateToOneWithWhereWithoutUserInput, PlayerUpdateWithoutUserInput>, PlayerUncheckedUpdateWithoutUserInput>
  }

  export type WalletUncheckedUpdateOneWithoutUserNestedInput = {
    create?: XOR<WalletCreateWithoutUserInput, WalletUncheckedCreateWithoutUserInput>
    connectOrCreate?: WalletCreateOrConnectWithoutUserInput
    upsert?: WalletUpsertWithoutUserInput
    disconnect?: WalletWhereInput | boolean
    delete?: WalletWhereInput | boolean
    connect?: WalletWhereUniqueInput
    update?: XOR<XOR<WalletUpdateToOneWithWhereWithoutUserInput, WalletUpdateWithoutUserInput>, WalletUncheckedUpdateWithoutUserInput>
  }

  export type GameScoreCreateNestedManyWithoutPlayerInput = {
    create?: XOR<GameScoreCreateWithoutPlayerInput, GameScoreUncheckedCreateWithoutPlayerInput> | GameScoreCreateWithoutPlayerInput[] | GameScoreUncheckedCreateWithoutPlayerInput[]
    connectOrCreate?: GameScoreCreateOrConnectWithoutPlayerInput | GameScoreCreateOrConnectWithoutPlayerInput[]
    createMany?: GameScoreCreateManyPlayerInputEnvelope
    connect?: GameScoreWhereUniqueInput | GameScoreWhereUniqueInput[]
  }

  export type PollVoteCreateNestedOneWithoutPlayerInput = {
    create?: XOR<PollVoteCreateWithoutPlayerInput, PollVoteUncheckedCreateWithoutPlayerInput>
    connectOrCreate?: PollVoteCreateOrConnectWithoutPlayerInput
    connect?: PollVoteWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutPlayerInput = {
    create?: XOR<UserCreateWithoutPlayerInput, UserUncheckedCreateWithoutPlayerInput>
    connectOrCreate?: UserCreateOrConnectWithoutPlayerInput
    connect?: UserWhereUniqueInput
  }

  export type TournamentWinnerCreateNestedManyWithoutPlayerInput = {
    create?: XOR<TournamentWinnerCreateWithoutPlayerInput, TournamentWinnerUncheckedCreateWithoutPlayerInput> | TournamentWinnerCreateWithoutPlayerInput[] | TournamentWinnerUncheckedCreateWithoutPlayerInput[]
    connectOrCreate?: TournamentWinnerCreateOrConnectWithoutPlayerInput | TournamentWinnerCreateOrConnectWithoutPlayerInput[]
    createMany?: TournamentWinnerCreateManyPlayerInputEnvelope
    connect?: TournamentWinnerWhereUniqueInput | TournamentWinnerWhereUniqueInput[]
  }

  export type WalletCreateNestedOneWithoutPlayerInput = {
    create?: XOR<WalletCreateWithoutPlayerInput, WalletUncheckedCreateWithoutPlayerInput>
    connectOrCreate?: WalletCreateOrConnectWithoutPlayerInput
    connect?: WalletWhereUniqueInput
  }

  export type PlayerStatsCreateNestedOneWithoutPlayerInput = {
    create?: XOR<PlayerStatsCreateWithoutPlayerInput, PlayerStatsUncheckedCreateWithoutPlayerInput>
    connectOrCreate?: PlayerStatsCreateOrConnectWithoutPlayerInput
    connect?: PlayerStatsWhereUniqueInput
  }

  export type TeamCreateNestedOneWithoutPlayersInput = {
    create?: XOR<TeamCreateWithoutPlayersInput, TeamUncheckedCreateWithoutPlayersInput>
    connectOrCreate?: TeamCreateOrConnectWithoutPlayersInput
    connect?: TeamWhereUniqueInput
  }

  export type GalleryCreateNestedOneWithoutPlayerInput = {
    create?: XOR<GalleryCreateWithoutPlayerInput, GalleryUncheckedCreateWithoutPlayerInput>
    connectOrCreate?: GalleryCreateOrConnectWithoutPlayerInput
    connect?: GalleryWhereUniqueInput
  }

  export type GameScoreUncheckedCreateNestedManyWithoutPlayerInput = {
    create?: XOR<GameScoreCreateWithoutPlayerInput, GameScoreUncheckedCreateWithoutPlayerInput> | GameScoreCreateWithoutPlayerInput[] | GameScoreUncheckedCreateWithoutPlayerInput[]
    connectOrCreate?: GameScoreCreateOrConnectWithoutPlayerInput | GameScoreCreateOrConnectWithoutPlayerInput[]
    createMany?: GameScoreCreateManyPlayerInputEnvelope
    connect?: GameScoreWhereUniqueInput | GameScoreWhereUniqueInput[]
  }

  export type PollVoteUncheckedCreateNestedOneWithoutPlayerInput = {
    create?: XOR<PollVoteCreateWithoutPlayerInput, PollVoteUncheckedCreateWithoutPlayerInput>
    connectOrCreate?: PollVoteCreateOrConnectWithoutPlayerInput
    connect?: PollVoteWhereUniqueInput
  }

  export type TournamentWinnerUncheckedCreateNestedManyWithoutPlayerInput = {
    create?: XOR<TournamentWinnerCreateWithoutPlayerInput, TournamentWinnerUncheckedCreateWithoutPlayerInput> | TournamentWinnerCreateWithoutPlayerInput[] | TournamentWinnerUncheckedCreateWithoutPlayerInput[]
    connectOrCreate?: TournamentWinnerCreateOrConnectWithoutPlayerInput | TournamentWinnerCreateOrConnectWithoutPlayerInput[]
    createMany?: TournamentWinnerCreateManyPlayerInputEnvelope
    connect?: TournamentWinnerWhereUniqueInput | TournamentWinnerWhereUniqueInput[]
  }

  export type WalletUncheckedCreateNestedOneWithoutPlayerInput = {
    create?: XOR<WalletCreateWithoutPlayerInput, WalletUncheckedCreateWithoutPlayerInput>
    connectOrCreate?: WalletCreateOrConnectWithoutPlayerInput
    connect?: WalletWhereUniqueInput
  }

  export type PlayerStatsUncheckedCreateNestedOneWithoutPlayerInput = {
    create?: XOR<PlayerStatsCreateWithoutPlayerInput, PlayerStatsUncheckedCreateWithoutPlayerInput>
    connectOrCreate?: PlayerStatsCreateOrConnectWithoutPlayerInput
    connect?: PlayerStatsWhereUniqueInput
  }

  export type EnumPlayerCategoryFieldUpdateOperationsInput = {
    set?: $Enums.PlayerCategory
  }

  export type GameScoreUpdateManyWithoutPlayerNestedInput = {
    create?: XOR<GameScoreCreateWithoutPlayerInput, GameScoreUncheckedCreateWithoutPlayerInput> | GameScoreCreateWithoutPlayerInput[] | GameScoreUncheckedCreateWithoutPlayerInput[]
    connectOrCreate?: GameScoreCreateOrConnectWithoutPlayerInput | GameScoreCreateOrConnectWithoutPlayerInput[]
    upsert?: GameScoreUpsertWithWhereUniqueWithoutPlayerInput | GameScoreUpsertWithWhereUniqueWithoutPlayerInput[]
    createMany?: GameScoreCreateManyPlayerInputEnvelope
    set?: GameScoreWhereUniqueInput | GameScoreWhereUniqueInput[]
    disconnect?: GameScoreWhereUniqueInput | GameScoreWhereUniqueInput[]
    delete?: GameScoreWhereUniqueInput | GameScoreWhereUniqueInput[]
    connect?: GameScoreWhereUniqueInput | GameScoreWhereUniqueInput[]
    update?: GameScoreUpdateWithWhereUniqueWithoutPlayerInput | GameScoreUpdateWithWhereUniqueWithoutPlayerInput[]
    updateMany?: GameScoreUpdateManyWithWhereWithoutPlayerInput | GameScoreUpdateManyWithWhereWithoutPlayerInput[]
    deleteMany?: GameScoreScalarWhereInput | GameScoreScalarWhereInput[]
  }

  export type PollVoteUpdateOneWithoutPlayerNestedInput = {
    create?: XOR<PollVoteCreateWithoutPlayerInput, PollVoteUncheckedCreateWithoutPlayerInput>
    connectOrCreate?: PollVoteCreateOrConnectWithoutPlayerInput
    upsert?: PollVoteUpsertWithoutPlayerInput
    disconnect?: PollVoteWhereInput | boolean
    delete?: PollVoteWhereInput | boolean
    connect?: PollVoteWhereUniqueInput
    update?: XOR<XOR<PollVoteUpdateToOneWithWhereWithoutPlayerInput, PollVoteUpdateWithoutPlayerInput>, PollVoteUncheckedUpdateWithoutPlayerInput>
  }

  export type UserUpdateOneRequiredWithoutPlayerNestedInput = {
    create?: XOR<UserCreateWithoutPlayerInput, UserUncheckedCreateWithoutPlayerInput>
    connectOrCreate?: UserCreateOrConnectWithoutPlayerInput
    upsert?: UserUpsertWithoutPlayerInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutPlayerInput, UserUpdateWithoutPlayerInput>, UserUncheckedUpdateWithoutPlayerInput>
  }

  export type TournamentWinnerUpdateManyWithoutPlayerNestedInput = {
    create?: XOR<TournamentWinnerCreateWithoutPlayerInput, TournamentWinnerUncheckedCreateWithoutPlayerInput> | TournamentWinnerCreateWithoutPlayerInput[] | TournamentWinnerUncheckedCreateWithoutPlayerInput[]
    connectOrCreate?: TournamentWinnerCreateOrConnectWithoutPlayerInput | TournamentWinnerCreateOrConnectWithoutPlayerInput[]
    upsert?: TournamentWinnerUpsertWithWhereUniqueWithoutPlayerInput | TournamentWinnerUpsertWithWhereUniqueWithoutPlayerInput[]
    createMany?: TournamentWinnerCreateManyPlayerInputEnvelope
    set?: TournamentWinnerWhereUniqueInput | TournamentWinnerWhereUniqueInput[]
    disconnect?: TournamentWinnerWhereUniqueInput | TournamentWinnerWhereUniqueInput[]
    delete?: TournamentWinnerWhereUniqueInput | TournamentWinnerWhereUniqueInput[]
    connect?: TournamentWinnerWhereUniqueInput | TournamentWinnerWhereUniqueInput[]
    update?: TournamentWinnerUpdateWithWhereUniqueWithoutPlayerInput | TournamentWinnerUpdateWithWhereUniqueWithoutPlayerInput[]
    updateMany?: TournamentWinnerUpdateManyWithWhereWithoutPlayerInput | TournamentWinnerUpdateManyWithWhereWithoutPlayerInput[]
    deleteMany?: TournamentWinnerScalarWhereInput | TournamentWinnerScalarWhereInput[]
  }

  export type WalletUpdateOneWithoutPlayerNestedInput = {
    create?: XOR<WalletCreateWithoutPlayerInput, WalletUncheckedCreateWithoutPlayerInput>
    connectOrCreate?: WalletCreateOrConnectWithoutPlayerInput
    upsert?: WalletUpsertWithoutPlayerInput
    disconnect?: WalletWhereInput | boolean
    delete?: WalletWhereInput | boolean
    connect?: WalletWhereUniqueInput
    update?: XOR<XOR<WalletUpdateToOneWithWhereWithoutPlayerInput, WalletUpdateWithoutPlayerInput>, WalletUncheckedUpdateWithoutPlayerInput>
  }

  export type PlayerStatsUpdateOneWithoutPlayerNestedInput = {
    create?: XOR<PlayerStatsCreateWithoutPlayerInput, PlayerStatsUncheckedCreateWithoutPlayerInput>
    connectOrCreate?: PlayerStatsCreateOrConnectWithoutPlayerInput
    upsert?: PlayerStatsUpsertWithoutPlayerInput
    disconnect?: PlayerStatsWhereInput | boolean
    delete?: PlayerStatsWhereInput | boolean
    connect?: PlayerStatsWhereUniqueInput
    update?: XOR<XOR<PlayerStatsUpdateToOneWithWhereWithoutPlayerInput, PlayerStatsUpdateWithoutPlayerInput>, PlayerStatsUncheckedUpdateWithoutPlayerInput>
  }

  export type TeamUpdateOneWithoutPlayersNestedInput = {
    create?: XOR<TeamCreateWithoutPlayersInput, TeamUncheckedCreateWithoutPlayersInput>
    connectOrCreate?: TeamCreateOrConnectWithoutPlayersInput
    upsert?: TeamUpsertWithoutPlayersInput
    disconnect?: TeamWhereInput | boolean
    delete?: TeamWhereInput | boolean
    connect?: TeamWhereUniqueInput
    update?: XOR<XOR<TeamUpdateToOneWithWhereWithoutPlayersInput, TeamUpdateWithoutPlayersInput>, TeamUncheckedUpdateWithoutPlayersInput>
  }

  export type GalleryUpdateOneWithoutPlayerNestedInput = {
    create?: XOR<GalleryCreateWithoutPlayerInput, GalleryUncheckedCreateWithoutPlayerInput>
    connectOrCreate?: GalleryCreateOrConnectWithoutPlayerInput
    upsert?: GalleryUpsertWithoutPlayerInput
    disconnect?: GalleryWhereInput | boolean
    delete?: GalleryWhereInput | boolean
    connect?: GalleryWhereUniqueInput
    update?: XOR<XOR<GalleryUpdateToOneWithWhereWithoutPlayerInput, GalleryUpdateWithoutPlayerInput>, GalleryUncheckedUpdateWithoutPlayerInput>
  }

  export type GameScoreUncheckedUpdateManyWithoutPlayerNestedInput = {
    create?: XOR<GameScoreCreateWithoutPlayerInput, GameScoreUncheckedCreateWithoutPlayerInput> | GameScoreCreateWithoutPlayerInput[] | GameScoreUncheckedCreateWithoutPlayerInput[]
    connectOrCreate?: GameScoreCreateOrConnectWithoutPlayerInput | GameScoreCreateOrConnectWithoutPlayerInput[]
    upsert?: GameScoreUpsertWithWhereUniqueWithoutPlayerInput | GameScoreUpsertWithWhereUniqueWithoutPlayerInput[]
    createMany?: GameScoreCreateManyPlayerInputEnvelope
    set?: GameScoreWhereUniqueInput | GameScoreWhereUniqueInput[]
    disconnect?: GameScoreWhereUniqueInput | GameScoreWhereUniqueInput[]
    delete?: GameScoreWhereUniqueInput | GameScoreWhereUniqueInput[]
    connect?: GameScoreWhereUniqueInput | GameScoreWhereUniqueInput[]
    update?: GameScoreUpdateWithWhereUniqueWithoutPlayerInput | GameScoreUpdateWithWhereUniqueWithoutPlayerInput[]
    updateMany?: GameScoreUpdateManyWithWhereWithoutPlayerInput | GameScoreUpdateManyWithWhereWithoutPlayerInput[]
    deleteMany?: GameScoreScalarWhereInput | GameScoreScalarWhereInput[]
  }

  export type PollVoteUncheckedUpdateOneWithoutPlayerNestedInput = {
    create?: XOR<PollVoteCreateWithoutPlayerInput, PollVoteUncheckedCreateWithoutPlayerInput>
    connectOrCreate?: PollVoteCreateOrConnectWithoutPlayerInput
    upsert?: PollVoteUpsertWithoutPlayerInput
    disconnect?: PollVoteWhereInput | boolean
    delete?: PollVoteWhereInput | boolean
    connect?: PollVoteWhereUniqueInput
    update?: XOR<XOR<PollVoteUpdateToOneWithWhereWithoutPlayerInput, PollVoteUpdateWithoutPlayerInput>, PollVoteUncheckedUpdateWithoutPlayerInput>
  }

  export type TournamentWinnerUncheckedUpdateManyWithoutPlayerNestedInput = {
    create?: XOR<TournamentWinnerCreateWithoutPlayerInput, TournamentWinnerUncheckedCreateWithoutPlayerInput> | TournamentWinnerCreateWithoutPlayerInput[] | TournamentWinnerUncheckedCreateWithoutPlayerInput[]
    connectOrCreate?: TournamentWinnerCreateOrConnectWithoutPlayerInput | TournamentWinnerCreateOrConnectWithoutPlayerInput[]
    upsert?: TournamentWinnerUpsertWithWhereUniqueWithoutPlayerInput | TournamentWinnerUpsertWithWhereUniqueWithoutPlayerInput[]
    createMany?: TournamentWinnerCreateManyPlayerInputEnvelope
    set?: TournamentWinnerWhereUniqueInput | TournamentWinnerWhereUniqueInput[]
    disconnect?: TournamentWinnerWhereUniqueInput | TournamentWinnerWhereUniqueInput[]
    delete?: TournamentWinnerWhereUniqueInput | TournamentWinnerWhereUniqueInput[]
    connect?: TournamentWinnerWhereUniqueInput | TournamentWinnerWhereUniqueInput[]
    update?: TournamentWinnerUpdateWithWhereUniqueWithoutPlayerInput | TournamentWinnerUpdateWithWhereUniqueWithoutPlayerInput[]
    updateMany?: TournamentWinnerUpdateManyWithWhereWithoutPlayerInput | TournamentWinnerUpdateManyWithWhereWithoutPlayerInput[]
    deleteMany?: TournamentWinnerScalarWhereInput | TournamentWinnerScalarWhereInput[]
  }

  export type WalletUncheckedUpdateOneWithoutPlayerNestedInput = {
    create?: XOR<WalletCreateWithoutPlayerInput, WalletUncheckedCreateWithoutPlayerInput>
    connectOrCreate?: WalletCreateOrConnectWithoutPlayerInput
    upsert?: WalletUpsertWithoutPlayerInput
    disconnect?: WalletWhereInput | boolean
    delete?: WalletWhereInput | boolean
    connect?: WalletWhereUniqueInput
    update?: XOR<XOR<WalletUpdateToOneWithWhereWithoutPlayerInput, WalletUpdateWithoutPlayerInput>, WalletUncheckedUpdateWithoutPlayerInput>
  }

  export type PlayerStatsUncheckedUpdateOneWithoutPlayerNestedInput = {
    create?: XOR<PlayerStatsCreateWithoutPlayerInput, PlayerStatsUncheckedCreateWithoutPlayerInput>
    connectOrCreate?: PlayerStatsCreateOrConnectWithoutPlayerInput
    upsert?: PlayerStatsUpsertWithoutPlayerInput
    disconnect?: PlayerStatsWhereInput | boolean
    delete?: PlayerStatsWhereInput | boolean
    connect?: PlayerStatsWhereUniqueInput
    update?: XOR<XOR<PlayerStatsUpdateToOneWithWhereWithoutPlayerInput, PlayerStatsUpdateWithoutPlayerInput>, PlayerStatsUncheckedUpdateWithoutPlayerInput>
  }

  export type PlayerCreateNestedOneWithoutGameScoreInput = {
    create?: XOR<PlayerCreateWithoutGameScoreInput, PlayerUncheckedCreateWithoutGameScoreInput>
    connectOrCreate?: PlayerCreateOrConnectWithoutGameScoreInput
    connect?: PlayerWhereUniqueInput
  }

  export type PlayerUpdateOneRequiredWithoutGameScoreNestedInput = {
    create?: XOR<PlayerCreateWithoutGameScoreInput, PlayerUncheckedCreateWithoutGameScoreInput>
    connectOrCreate?: PlayerCreateOrConnectWithoutGameScoreInput
    upsert?: PlayerUpsertWithoutGameScoreInput
    connect?: PlayerWhereUniqueInput
    update?: XOR<XOR<PlayerUpdateToOneWithWhereWithoutGameScoreInput, PlayerUpdateWithoutGameScoreInput>, PlayerUncheckedUpdateWithoutGameScoreInput>
  }

  export type PlayerCreateNestedOneWithoutCharacterImageInput = {
    create?: XOR<PlayerCreateWithoutCharacterImageInput, PlayerUncheckedCreateWithoutCharacterImageInput>
    connectOrCreate?: PlayerCreateOrConnectWithoutCharacterImageInput
    connect?: PlayerWhereUniqueInput
  }

  export type TournamentCreateNestedManyWithoutGalleryInput = {
    create?: XOR<TournamentCreateWithoutGalleryInput, TournamentUncheckedCreateWithoutGalleryInput> | TournamentCreateWithoutGalleryInput[] | TournamentUncheckedCreateWithoutGalleryInput[]
    connectOrCreate?: TournamentCreateOrConnectWithoutGalleryInput | TournamentCreateOrConnectWithoutGalleryInput[]
    createMany?: TournamentCreateManyGalleryInputEnvelope
    connect?: TournamentWhereUniqueInput | TournamentWhereUniqueInput[]
  }

  export type PlayerUncheckedCreateNestedOneWithoutCharacterImageInput = {
    create?: XOR<PlayerCreateWithoutCharacterImageInput, PlayerUncheckedCreateWithoutCharacterImageInput>
    connectOrCreate?: PlayerCreateOrConnectWithoutCharacterImageInput
    connect?: PlayerWhereUniqueInput
  }

  export type TournamentUncheckedCreateNestedManyWithoutGalleryInput = {
    create?: XOR<TournamentCreateWithoutGalleryInput, TournamentUncheckedCreateWithoutGalleryInput> | TournamentCreateWithoutGalleryInput[] | TournamentUncheckedCreateWithoutGalleryInput[]
    connectOrCreate?: TournamentCreateOrConnectWithoutGalleryInput | TournamentCreateOrConnectWithoutGalleryInput[]
    createMany?: TournamentCreateManyGalleryInputEnvelope
    connect?: TournamentWhereUniqueInput | TournamentWhereUniqueInput[]
  }

  export type PlayerUpdateOneWithoutCharacterImageNestedInput = {
    create?: XOR<PlayerCreateWithoutCharacterImageInput, PlayerUncheckedCreateWithoutCharacterImageInput>
    connectOrCreate?: PlayerCreateOrConnectWithoutCharacterImageInput
    upsert?: PlayerUpsertWithoutCharacterImageInput
    disconnect?: PlayerWhereInput | boolean
    delete?: PlayerWhereInput | boolean
    connect?: PlayerWhereUniqueInput
    update?: XOR<XOR<PlayerUpdateToOneWithWhereWithoutCharacterImageInput, PlayerUpdateWithoutCharacterImageInput>, PlayerUncheckedUpdateWithoutCharacterImageInput>
  }

  export type TournamentUpdateManyWithoutGalleryNestedInput = {
    create?: XOR<TournamentCreateWithoutGalleryInput, TournamentUncheckedCreateWithoutGalleryInput> | TournamentCreateWithoutGalleryInput[] | TournamentUncheckedCreateWithoutGalleryInput[]
    connectOrCreate?: TournamentCreateOrConnectWithoutGalleryInput | TournamentCreateOrConnectWithoutGalleryInput[]
    upsert?: TournamentUpsertWithWhereUniqueWithoutGalleryInput | TournamentUpsertWithWhereUniqueWithoutGalleryInput[]
    createMany?: TournamentCreateManyGalleryInputEnvelope
    set?: TournamentWhereUniqueInput | TournamentWhereUniqueInput[]
    disconnect?: TournamentWhereUniqueInput | TournamentWhereUniqueInput[]
    delete?: TournamentWhereUniqueInput | TournamentWhereUniqueInput[]
    connect?: TournamentWhereUniqueInput | TournamentWhereUniqueInput[]
    update?: TournamentUpdateWithWhereUniqueWithoutGalleryInput | TournamentUpdateWithWhereUniqueWithoutGalleryInput[]
    updateMany?: TournamentUpdateManyWithWhereWithoutGalleryInput | TournamentUpdateManyWithWhereWithoutGalleryInput[]
    deleteMany?: TournamentScalarWhereInput | TournamentScalarWhereInput[]
  }

  export type PlayerUncheckedUpdateOneWithoutCharacterImageNestedInput = {
    create?: XOR<PlayerCreateWithoutCharacterImageInput, PlayerUncheckedCreateWithoutCharacterImageInput>
    connectOrCreate?: PlayerCreateOrConnectWithoutCharacterImageInput
    upsert?: PlayerUpsertWithoutCharacterImageInput
    disconnect?: PlayerWhereInput | boolean
    delete?: PlayerWhereInput | boolean
    connect?: PlayerWhereUniqueInput
    update?: XOR<XOR<PlayerUpdateToOneWithWhereWithoutCharacterImageInput, PlayerUpdateWithoutCharacterImageInput>, PlayerUncheckedUpdateWithoutCharacterImageInput>
  }

  export type TournamentUncheckedUpdateManyWithoutGalleryNestedInput = {
    create?: XOR<TournamentCreateWithoutGalleryInput, TournamentUncheckedCreateWithoutGalleryInput> | TournamentCreateWithoutGalleryInput[] | TournamentUncheckedCreateWithoutGalleryInput[]
    connectOrCreate?: TournamentCreateOrConnectWithoutGalleryInput | TournamentCreateOrConnectWithoutGalleryInput[]
    upsert?: TournamentUpsertWithWhereUniqueWithoutGalleryInput | TournamentUpsertWithWhereUniqueWithoutGalleryInput[]
    createMany?: TournamentCreateManyGalleryInputEnvelope
    set?: TournamentWhereUniqueInput | TournamentWhereUniqueInput[]
    disconnect?: TournamentWhereUniqueInput | TournamentWhereUniqueInput[]
    delete?: TournamentWhereUniqueInput | TournamentWhereUniqueInput[]
    connect?: TournamentWhereUniqueInput | TournamentWhereUniqueInput[]
    update?: TournamentUpdateWithWhereUniqueWithoutGalleryInput | TournamentUpdateWithWhereUniqueWithoutGalleryInput[]
    updateMany?: TournamentUpdateManyWithWhereWithoutGalleryInput | TournamentUpdateManyWithWhereWithoutGalleryInput[]
    deleteMany?: TournamentScalarWhereInput | TournamentScalarWhereInput[]
  }

  export type TournamentCreateNestedManyWithoutSeasonInput = {
    create?: XOR<TournamentCreateWithoutSeasonInput, TournamentUncheckedCreateWithoutSeasonInput> | TournamentCreateWithoutSeasonInput[] | TournamentUncheckedCreateWithoutSeasonInput[]
    connectOrCreate?: TournamentCreateOrConnectWithoutSeasonInput | TournamentCreateOrConnectWithoutSeasonInput[]
    createMany?: TournamentCreateManySeasonInputEnvelope
    connect?: TournamentWhereUniqueInput | TournamentWhereUniqueInput[]
  }

  export type TournamentUncheckedCreateNestedManyWithoutSeasonInput = {
    create?: XOR<TournamentCreateWithoutSeasonInput, TournamentUncheckedCreateWithoutSeasonInput> | TournamentCreateWithoutSeasonInput[] | TournamentUncheckedCreateWithoutSeasonInput[]
    connectOrCreate?: TournamentCreateOrConnectWithoutSeasonInput | TournamentCreateOrConnectWithoutSeasonInput[]
    createMany?: TournamentCreateManySeasonInputEnvelope
    connect?: TournamentWhereUniqueInput | TournamentWhereUniqueInput[]
  }

  export type EnumSeasonStatusFieldUpdateOperationsInput = {
    set?: $Enums.SeasonStatus
  }

  export type TournamentUpdateManyWithoutSeasonNestedInput = {
    create?: XOR<TournamentCreateWithoutSeasonInput, TournamentUncheckedCreateWithoutSeasonInput> | TournamentCreateWithoutSeasonInput[] | TournamentUncheckedCreateWithoutSeasonInput[]
    connectOrCreate?: TournamentCreateOrConnectWithoutSeasonInput | TournamentCreateOrConnectWithoutSeasonInput[]
    upsert?: TournamentUpsertWithWhereUniqueWithoutSeasonInput | TournamentUpsertWithWhereUniqueWithoutSeasonInput[]
    createMany?: TournamentCreateManySeasonInputEnvelope
    set?: TournamentWhereUniqueInput | TournamentWhereUniqueInput[]
    disconnect?: TournamentWhereUniqueInput | TournamentWhereUniqueInput[]
    delete?: TournamentWhereUniqueInput | TournamentWhereUniqueInput[]
    connect?: TournamentWhereUniqueInput | TournamentWhereUniqueInput[]
    update?: TournamentUpdateWithWhereUniqueWithoutSeasonInput | TournamentUpdateWithWhereUniqueWithoutSeasonInput[]
    updateMany?: TournamentUpdateManyWithWhereWithoutSeasonInput | TournamentUpdateManyWithWhereWithoutSeasonInput[]
    deleteMany?: TournamentScalarWhereInput | TournamentScalarWhereInput[]
  }

  export type TournamentUncheckedUpdateManyWithoutSeasonNestedInput = {
    create?: XOR<TournamentCreateWithoutSeasonInput, TournamentUncheckedCreateWithoutSeasonInput> | TournamentCreateWithoutSeasonInput[] | TournamentUncheckedCreateWithoutSeasonInput[]
    connectOrCreate?: TournamentCreateOrConnectWithoutSeasonInput | TournamentCreateOrConnectWithoutSeasonInput[]
    upsert?: TournamentUpsertWithWhereUniqueWithoutSeasonInput | TournamentUpsertWithWhereUniqueWithoutSeasonInput[]
    createMany?: TournamentCreateManySeasonInputEnvelope
    set?: TournamentWhereUniqueInput | TournamentWhereUniqueInput[]
    disconnect?: TournamentWhereUniqueInput | TournamentWhereUniqueInput[]
    delete?: TournamentWhereUniqueInput | TournamentWhereUniqueInput[]
    connect?: TournamentWhereUniqueInput | TournamentWhereUniqueInput[]
    update?: TournamentUpdateWithWhereUniqueWithoutSeasonInput | TournamentUpdateWithWhereUniqueWithoutSeasonInput[]
    updateMany?: TournamentUpdateManyWithWhereWithoutSeasonInput | TournamentUpdateManyWithWhereWithoutSeasonInput[]
    deleteMany?: TournamentScalarWhereInput | TournamentScalarWhereInput[]
  }

  export type TeamCreateNestedManyWithoutTournamentInput = {
    create?: XOR<TeamCreateWithoutTournamentInput, TeamUncheckedCreateWithoutTournamentInput> | TeamCreateWithoutTournamentInput[] | TeamUncheckedCreateWithoutTournamentInput[]
    connectOrCreate?: TeamCreateOrConnectWithoutTournamentInput | TeamCreateOrConnectWithoutTournamentInput[]
    createMany?: TeamCreateManyTournamentInputEnvelope
    connect?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
  }

  export type UserCreateNestedManyWithoutTournamentInput = {
    create?: XOR<UserCreateWithoutTournamentInput, UserUncheckedCreateWithoutTournamentInput> | UserCreateWithoutTournamentInput[] | UserUncheckedCreateWithoutTournamentInput[]
    connectOrCreate?: UserCreateOrConnectWithoutTournamentInput | UserCreateOrConnectWithoutTournamentInput[]
    createMany?: UserCreateManyTournamentInputEnvelope
    connect?: UserWhereUniqueInput | UserWhereUniqueInput[]
  }

  export type SeasonCreateNestedOneWithoutTournamentInput = {
    create?: XOR<SeasonCreateWithoutTournamentInput, SeasonUncheckedCreateWithoutTournamentInput>
    connectOrCreate?: SeasonCreateOrConnectWithoutTournamentInput
    connect?: SeasonWhereUniqueInput
  }

  export type TournamentWinnerCreateNestedManyWithoutTournamentInput = {
    create?: XOR<TournamentWinnerCreateWithoutTournamentInput, TournamentWinnerUncheckedCreateWithoutTournamentInput> | TournamentWinnerCreateWithoutTournamentInput[] | TournamentWinnerUncheckedCreateWithoutTournamentInput[]
    connectOrCreate?: TournamentWinnerCreateOrConnectWithoutTournamentInput | TournamentWinnerCreateOrConnectWithoutTournamentInput[]
    createMany?: TournamentWinnerCreateManyTournamentInputEnvelope
    connect?: TournamentWinnerWhereUniqueInput | TournamentWinnerWhereUniqueInput[]
  }

  export type PollVoteCreateNestedManyWithoutTournamentInput = {
    create?: XOR<PollVoteCreateWithoutTournamentInput, PollVoteUncheckedCreateWithoutTournamentInput> | PollVoteCreateWithoutTournamentInput[] | PollVoteUncheckedCreateWithoutTournamentInput[]
    connectOrCreate?: PollVoteCreateOrConnectWithoutTournamentInput | PollVoteCreateOrConnectWithoutTournamentInput[]
    createMany?: PollVoteCreateManyTournamentInputEnvelope
    connect?: PollVoteWhereUniqueInput | PollVoteWhereUniqueInput[]
  }

  export type MatchCreateNestedManyWithoutTournamentInput = {
    create?: XOR<MatchCreateWithoutTournamentInput, MatchUncheckedCreateWithoutTournamentInput> | MatchCreateWithoutTournamentInput[] | MatchUncheckedCreateWithoutTournamentInput[]
    connectOrCreate?: MatchCreateOrConnectWithoutTournamentInput | MatchCreateOrConnectWithoutTournamentInput[]
    createMany?: MatchCreateManyTournamentInputEnvelope
    connect?: MatchWhereUniqueInput | MatchWhereUniqueInput[]
  }

  export type GalleryCreateNestedOneWithoutTournamentInput = {
    create?: XOR<GalleryCreateWithoutTournamentInput, GalleryUncheckedCreateWithoutTournamentInput>
    connectOrCreate?: GalleryCreateOrConnectWithoutTournamentInput
    connect?: GalleryWhereUniqueInput
  }

  export type TeamUncheckedCreateNestedManyWithoutTournamentInput = {
    create?: XOR<TeamCreateWithoutTournamentInput, TeamUncheckedCreateWithoutTournamentInput> | TeamCreateWithoutTournamentInput[] | TeamUncheckedCreateWithoutTournamentInput[]
    connectOrCreate?: TeamCreateOrConnectWithoutTournamentInput | TeamCreateOrConnectWithoutTournamentInput[]
    createMany?: TeamCreateManyTournamentInputEnvelope
    connect?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
  }

  export type UserUncheckedCreateNestedManyWithoutTournamentInput = {
    create?: XOR<UserCreateWithoutTournamentInput, UserUncheckedCreateWithoutTournamentInput> | UserCreateWithoutTournamentInput[] | UserUncheckedCreateWithoutTournamentInput[]
    connectOrCreate?: UserCreateOrConnectWithoutTournamentInput | UserCreateOrConnectWithoutTournamentInput[]
    createMany?: UserCreateManyTournamentInputEnvelope
    connect?: UserWhereUniqueInput | UserWhereUniqueInput[]
  }

  export type TournamentWinnerUncheckedCreateNestedManyWithoutTournamentInput = {
    create?: XOR<TournamentWinnerCreateWithoutTournamentInput, TournamentWinnerUncheckedCreateWithoutTournamentInput> | TournamentWinnerCreateWithoutTournamentInput[] | TournamentWinnerUncheckedCreateWithoutTournamentInput[]
    connectOrCreate?: TournamentWinnerCreateOrConnectWithoutTournamentInput | TournamentWinnerCreateOrConnectWithoutTournamentInput[]
    createMany?: TournamentWinnerCreateManyTournamentInputEnvelope
    connect?: TournamentWinnerWhereUniqueInput | TournamentWinnerWhereUniqueInput[]
  }

  export type PollVoteUncheckedCreateNestedManyWithoutTournamentInput = {
    create?: XOR<PollVoteCreateWithoutTournamentInput, PollVoteUncheckedCreateWithoutTournamentInput> | PollVoteCreateWithoutTournamentInput[] | PollVoteUncheckedCreateWithoutTournamentInput[]
    connectOrCreate?: PollVoteCreateOrConnectWithoutTournamentInput | PollVoteCreateOrConnectWithoutTournamentInput[]
    createMany?: PollVoteCreateManyTournamentInputEnvelope
    connect?: PollVoteWhereUniqueInput | PollVoteWhereUniqueInput[]
  }

  export type MatchUncheckedCreateNestedManyWithoutTournamentInput = {
    create?: XOR<MatchCreateWithoutTournamentInput, MatchUncheckedCreateWithoutTournamentInput> | MatchCreateWithoutTournamentInput[] | MatchUncheckedCreateWithoutTournamentInput[]
    connectOrCreate?: MatchCreateOrConnectWithoutTournamentInput | MatchCreateOrConnectWithoutTournamentInput[]
    createMany?: MatchCreateManyTournamentInputEnvelope
    connect?: MatchWhereUniqueInput | MatchWhereUniqueInput[]
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type TeamUpdateManyWithoutTournamentNestedInput = {
    create?: XOR<TeamCreateWithoutTournamentInput, TeamUncheckedCreateWithoutTournamentInput> | TeamCreateWithoutTournamentInput[] | TeamUncheckedCreateWithoutTournamentInput[]
    connectOrCreate?: TeamCreateOrConnectWithoutTournamentInput | TeamCreateOrConnectWithoutTournamentInput[]
    upsert?: TeamUpsertWithWhereUniqueWithoutTournamentInput | TeamUpsertWithWhereUniqueWithoutTournamentInput[]
    createMany?: TeamCreateManyTournamentInputEnvelope
    set?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
    disconnect?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
    delete?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
    connect?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
    update?: TeamUpdateWithWhereUniqueWithoutTournamentInput | TeamUpdateWithWhereUniqueWithoutTournamentInput[]
    updateMany?: TeamUpdateManyWithWhereWithoutTournamentInput | TeamUpdateManyWithWhereWithoutTournamentInput[]
    deleteMany?: TeamScalarWhereInput | TeamScalarWhereInput[]
  }

  export type UserUpdateManyWithoutTournamentNestedInput = {
    create?: XOR<UserCreateWithoutTournamentInput, UserUncheckedCreateWithoutTournamentInput> | UserCreateWithoutTournamentInput[] | UserUncheckedCreateWithoutTournamentInput[]
    connectOrCreate?: UserCreateOrConnectWithoutTournamentInput | UserCreateOrConnectWithoutTournamentInput[]
    upsert?: UserUpsertWithWhereUniqueWithoutTournamentInput | UserUpsertWithWhereUniqueWithoutTournamentInput[]
    createMany?: UserCreateManyTournamentInputEnvelope
    set?: UserWhereUniqueInput | UserWhereUniqueInput[]
    disconnect?: UserWhereUniqueInput | UserWhereUniqueInput[]
    delete?: UserWhereUniqueInput | UserWhereUniqueInput[]
    connect?: UserWhereUniqueInput | UserWhereUniqueInput[]
    update?: UserUpdateWithWhereUniqueWithoutTournamentInput | UserUpdateWithWhereUniqueWithoutTournamentInput[]
    updateMany?: UserUpdateManyWithWhereWithoutTournamentInput | UserUpdateManyWithWhereWithoutTournamentInput[]
    deleteMany?: UserScalarWhereInput | UserScalarWhereInput[]
  }

  export type SeasonUpdateOneWithoutTournamentNestedInput = {
    create?: XOR<SeasonCreateWithoutTournamentInput, SeasonUncheckedCreateWithoutTournamentInput>
    connectOrCreate?: SeasonCreateOrConnectWithoutTournamentInput
    upsert?: SeasonUpsertWithoutTournamentInput
    disconnect?: SeasonWhereInput | boolean
    delete?: SeasonWhereInput | boolean
    connect?: SeasonWhereUniqueInput
    update?: XOR<XOR<SeasonUpdateToOneWithWhereWithoutTournamentInput, SeasonUpdateWithoutTournamentInput>, SeasonUncheckedUpdateWithoutTournamentInput>
  }

  export type TournamentWinnerUpdateManyWithoutTournamentNestedInput = {
    create?: XOR<TournamentWinnerCreateWithoutTournamentInput, TournamentWinnerUncheckedCreateWithoutTournamentInput> | TournamentWinnerCreateWithoutTournamentInput[] | TournamentWinnerUncheckedCreateWithoutTournamentInput[]
    connectOrCreate?: TournamentWinnerCreateOrConnectWithoutTournamentInput | TournamentWinnerCreateOrConnectWithoutTournamentInput[]
    upsert?: TournamentWinnerUpsertWithWhereUniqueWithoutTournamentInput | TournamentWinnerUpsertWithWhereUniqueWithoutTournamentInput[]
    createMany?: TournamentWinnerCreateManyTournamentInputEnvelope
    set?: TournamentWinnerWhereUniqueInput | TournamentWinnerWhereUniqueInput[]
    disconnect?: TournamentWinnerWhereUniqueInput | TournamentWinnerWhereUniqueInput[]
    delete?: TournamentWinnerWhereUniqueInput | TournamentWinnerWhereUniqueInput[]
    connect?: TournamentWinnerWhereUniqueInput | TournamentWinnerWhereUniqueInput[]
    update?: TournamentWinnerUpdateWithWhereUniqueWithoutTournamentInput | TournamentWinnerUpdateWithWhereUniqueWithoutTournamentInput[]
    updateMany?: TournamentWinnerUpdateManyWithWhereWithoutTournamentInput | TournamentWinnerUpdateManyWithWhereWithoutTournamentInput[]
    deleteMany?: TournamentWinnerScalarWhereInput | TournamentWinnerScalarWhereInput[]
  }

  export type PollVoteUpdateManyWithoutTournamentNestedInput = {
    create?: XOR<PollVoteCreateWithoutTournamentInput, PollVoteUncheckedCreateWithoutTournamentInput> | PollVoteCreateWithoutTournamentInput[] | PollVoteUncheckedCreateWithoutTournamentInput[]
    connectOrCreate?: PollVoteCreateOrConnectWithoutTournamentInput | PollVoteCreateOrConnectWithoutTournamentInput[]
    upsert?: PollVoteUpsertWithWhereUniqueWithoutTournamentInput | PollVoteUpsertWithWhereUniqueWithoutTournamentInput[]
    createMany?: PollVoteCreateManyTournamentInputEnvelope
    set?: PollVoteWhereUniqueInput | PollVoteWhereUniqueInput[]
    disconnect?: PollVoteWhereUniqueInput | PollVoteWhereUniqueInput[]
    delete?: PollVoteWhereUniqueInput | PollVoteWhereUniqueInput[]
    connect?: PollVoteWhereUniqueInput | PollVoteWhereUniqueInput[]
    update?: PollVoteUpdateWithWhereUniqueWithoutTournamentInput | PollVoteUpdateWithWhereUniqueWithoutTournamentInput[]
    updateMany?: PollVoteUpdateManyWithWhereWithoutTournamentInput | PollVoteUpdateManyWithWhereWithoutTournamentInput[]
    deleteMany?: PollVoteScalarWhereInput | PollVoteScalarWhereInput[]
  }

  export type MatchUpdateManyWithoutTournamentNestedInput = {
    create?: XOR<MatchCreateWithoutTournamentInput, MatchUncheckedCreateWithoutTournamentInput> | MatchCreateWithoutTournamentInput[] | MatchUncheckedCreateWithoutTournamentInput[]
    connectOrCreate?: MatchCreateOrConnectWithoutTournamentInput | MatchCreateOrConnectWithoutTournamentInput[]
    upsert?: MatchUpsertWithWhereUniqueWithoutTournamentInput | MatchUpsertWithWhereUniqueWithoutTournamentInput[]
    createMany?: MatchCreateManyTournamentInputEnvelope
    set?: MatchWhereUniqueInput | MatchWhereUniqueInput[]
    disconnect?: MatchWhereUniqueInput | MatchWhereUniqueInput[]
    delete?: MatchWhereUniqueInput | MatchWhereUniqueInput[]
    connect?: MatchWhereUniqueInput | MatchWhereUniqueInput[]
    update?: MatchUpdateWithWhereUniqueWithoutTournamentInput | MatchUpdateWithWhereUniqueWithoutTournamentInput[]
    updateMany?: MatchUpdateManyWithWhereWithoutTournamentInput | MatchUpdateManyWithWhereWithoutTournamentInput[]
    deleteMany?: MatchScalarWhereInput | MatchScalarWhereInput[]
  }

  export type GalleryUpdateOneWithoutTournamentNestedInput = {
    create?: XOR<GalleryCreateWithoutTournamentInput, GalleryUncheckedCreateWithoutTournamentInput>
    connectOrCreate?: GalleryCreateOrConnectWithoutTournamentInput
    upsert?: GalleryUpsertWithoutTournamentInput
    disconnect?: GalleryWhereInput | boolean
    delete?: GalleryWhereInput | boolean
    connect?: GalleryWhereUniqueInput
    update?: XOR<XOR<GalleryUpdateToOneWithWhereWithoutTournamentInput, GalleryUpdateWithoutTournamentInput>, GalleryUncheckedUpdateWithoutTournamentInput>
  }

  export type TeamUncheckedUpdateManyWithoutTournamentNestedInput = {
    create?: XOR<TeamCreateWithoutTournamentInput, TeamUncheckedCreateWithoutTournamentInput> | TeamCreateWithoutTournamentInput[] | TeamUncheckedCreateWithoutTournamentInput[]
    connectOrCreate?: TeamCreateOrConnectWithoutTournamentInput | TeamCreateOrConnectWithoutTournamentInput[]
    upsert?: TeamUpsertWithWhereUniqueWithoutTournamentInput | TeamUpsertWithWhereUniqueWithoutTournamentInput[]
    createMany?: TeamCreateManyTournamentInputEnvelope
    set?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
    disconnect?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
    delete?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
    connect?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
    update?: TeamUpdateWithWhereUniqueWithoutTournamentInput | TeamUpdateWithWhereUniqueWithoutTournamentInput[]
    updateMany?: TeamUpdateManyWithWhereWithoutTournamentInput | TeamUpdateManyWithWhereWithoutTournamentInput[]
    deleteMany?: TeamScalarWhereInput | TeamScalarWhereInput[]
  }

  export type UserUncheckedUpdateManyWithoutTournamentNestedInput = {
    create?: XOR<UserCreateWithoutTournamentInput, UserUncheckedCreateWithoutTournamentInput> | UserCreateWithoutTournamentInput[] | UserUncheckedCreateWithoutTournamentInput[]
    connectOrCreate?: UserCreateOrConnectWithoutTournamentInput | UserCreateOrConnectWithoutTournamentInput[]
    upsert?: UserUpsertWithWhereUniqueWithoutTournamentInput | UserUpsertWithWhereUniqueWithoutTournamentInput[]
    createMany?: UserCreateManyTournamentInputEnvelope
    set?: UserWhereUniqueInput | UserWhereUniqueInput[]
    disconnect?: UserWhereUniqueInput | UserWhereUniqueInput[]
    delete?: UserWhereUniqueInput | UserWhereUniqueInput[]
    connect?: UserWhereUniqueInput | UserWhereUniqueInput[]
    update?: UserUpdateWithWhereUniqueWithoutTournamentInput | UserUpdateWithWhereUniqueWithoutTournamentInput[]
    updateMany?: UserUpdateManyWithWhereWithoutTournamentInput | UserUpdateManyWithWhereWithoutTournamentInput[]
    deleteMany?: UserScalarWhereInput | UserScalarWhereInput[]
  }

  export type TournamentWinnerUncheckedUpdateManyWithoutTournamentNestedInput = {
    create?: XOR<TournamentWinnerCreateWithoutTournamentInput, TournamentWinnerUncheckedCreateWithoutTournamentInput> | TournamentWinnerCreateWithoutTournamentInput[] | TournamentWinnerUncheckedCreateWithoutTournamentInput[]
    connectOrCreate?: TournamentWinnerCreateOrConnectWithoutTournamentInput | TournamentWinnerCreateOrConnectWithoutTournamentInput[]
    upsert?: TournamentWinnerUpsertWithWhereUniqueWithoutTournamentInput | TournamentWinnerUpsertWithWhereUniqueWithoutTournamentInput[]
    createMany?: TournamentWinnerCreateManyTournamentInputEnvelope
    set?: TournamentWinnerWhereUniqueInput | TournamentWinnerWhereUniqueInput[]
    disconnect?: TournamentWinnerWhereUniqueInput | TournamentWinnerWhereUniqueInput[]
    delete?: TournamentWinnerWhereUniqueInput | TournamentWinnerWhereUniqueInput[]
    connect?: TournamentWinnerWhereUniqueInput | TournamentWinnerWhereUniqueInput[]
    update?: TournamentWinnerUpdateWithWhereUniqueWithoutTournamentInput | TournamentWinnerUpdateWithWhereUniqueWithoutTournamentInput[]
    updateMany?: TournamentWinnerUpdateManyWithWhereWithoutTournamentInput | TournamentWinnerUpdateManyWithWhereWithoutTournamentInput[]
    deleteMany?: TournamentWinnerScalarWhereInput | TournamentWinnerScalarWhereInput[]
  }

  export type PollVoteUncheckedUpdateManyWithoutTournamentNestedInput = {
    create?: XOR<PollVoteCreateWithoutTournamentInput, PollVoteUncheckedCreateWithoutTournamentInput> | PollVoteCreateWithoutTournamentInput[] | PollVoteUncheckedCreateWithoutTournamentInput[]
    connectOrCreate?: PollVoteCreateOrConnectWithoutTournamentInput | PollVoteCreateOrConnectWithoutTournamentInput[]
    upsert?: PollVoteUpsertWithWhereUniqueWithoutTournamentInput | PollVoteUpsertWithWhereUniqueWithoutTournamentInput[]
    createMany?: PollVoteCreateManyTournamentInputEnvelope
    set?: PollVoteWhereUniqueInput | PollVoteWhereUniqueInput[]
    disconnect?: PollVoteWhereUniqueInput | PollVoteWhereUniqueInput[]
    delete?: PollVoteWhereUniqueInput | PollVoteWhereUniqueInput[]
    connect?: PollVoteWhereUniqueInput | PollVoteWhereUniqueInput[]
    update?: PollVoteUpdateWithWhereUniqueWithoutTournamentInput | PollVoteUpdateWithWhereUniqueWithoutTournamentInput[]
    updateMany?: PollVoteUpdateManyWithWhereWithoutTournamentInput | PollVoteUpdateManyWithWhereWithoutTournamentInput[]
    deleteMany?: PollVoteScalarWhereInput | PollVoteScalarWhereInput[]
  }

  export type MatchUncheckedUpdateManyWithoutTournamentNestedInput = {
    create?: XOR<MatchCreateWithoutTournamentInput, MatchUncheckedCreateWithoutTournamentInput> | MatchCreateWithoutTournamentInput[] | MatchUncheckedCreateWithoutTournamentInput[]
    connectOrCreate?: MatchCreateOrConnectWithoutTournamentInput | MatchCreateOrConnectWithoutTournamentInput[]
    upsert?: MatchUpsertWithWhereUniqueWithoutTournamentInput | MatchUpsertWithWhereUniqueWithoutTournamentInput[]
    createMany?: MatchCreateManyTournamentInputEnvelope
    set?: MatchWhereUniqueInput | MatchWhereUniqueInput[]
    disconnect?: MatchWhereUniqueInput | MatchWhereUniqueInput[]
    delete?: MatchWhereUniqueInput | MatchWhereUniqueInput[]
    connect?: MatchWhereUniqueInput | MatchWhereUniqueInput[]
    update?: MatchUpdateWithWhereUniqueWithoutTournamentInput | MatchUpdateWithWhereUniqueWithoutTournamentInput[]
    updateMany?: MatchUpdateManyWithWhereWithoutTournamentInput | MatchUpdateManyWithWhereWithoutTournamentInput[]
    deleteMany?: MatchScalarWhereInput | MatchScalarWhereInput[]
  }

  export type PlayerCreateNestedOneWithoutPollVoteInput = {
    create?: XOR<PlayerCreateWithoutPollVoteInput, PlayerUncheckedCreateWithoutPollVoteInput>
    connectOrCreate?: PlayerCreateOrConnectWithoutPollVoteInput
    connect?: PlayerWhereUniqueInput
  }

  export type TournamentCreateNestedOneWithoutPollVoteInput = {
    create?: XOR<TournamentCreateWithoutPollVoteInput, TournamentUncheckedCreateWithoutPollVoteInput>
    connectOrCreate?: TournamentCreateOrConnectWithoutPollVoteInput
    connect?: TournamentWhereUniqueInput
  }

  export type EnumVoteFieldUpdateOperationsInput = {
    set?: $Enums.Vote
  }

  export type PlayerUpdateOneRequiredWithoutPollVoteNestedInput = {
    create?: XOR<PlayerCreateWithoutPollVoteInput, PlayerUncheckedCreateWithoutPollVoteInput>
    connectOrCreate?: PlayerCreateOrConnectWithoutPollVoteInput
    upsert?: PlayerUpsertWithoutPollVoteInput
    connect?: PlayerWhereUniqueInput
    update?: XOR<XOR<PlayerUpdateToOneWithWhereWithoutPollVoteInput, PlayerUpdateWithoutPollVoteInput>, PlayerUncheckedUpdateWithoutPollVoteInput>
  }

  export type TournamentUpdateOneRequiredWithoutPollVoteNestedInput = {
    create?: XOR<TournamentCreateWithoutPollVoteInput, TournamentUncheckedCreateWithoutPollVoteInput>
    connectOrCreate?: TournamentCreateOrConnectWithoutPollVoteInput
    upsert?: TournamentUpsertWithoutPollVoteInput
    connect?: TournamentWhereUniqueInput
    update?: XOR<XOR<TournamentUpdateToOneWithWhereWithoutPollVoteInput, TournamentUpdateWithoutPollVoteInput>, TournamentUncheckedUpdateWithoutPollVoteInput>
  }

  export type PlayerCreateNestedOneWithoutTournamentWinnerInput = {
    create?: XOR<PlayerCreateWithoutTournamentWinnerInput, PlayerUncheckedCreateWithoutTournamentWinnerInput>
    connectOrCreate?: PlayerCreateOrConnectWithoutTournamentWinnerInput
    connect?: PlayerWhereUniqueInput
  }

  export type TournamentCreateNestedOneWithoutTournamentWinnerInput = {
    create?: XOR<TournamentCreateWithoutTournamentWinnerInput, TournamentUncheckedCreateWithoutTournamentWinnerInput>
    connectOrCreate?: TournamentCreateOrConnectWithoutTournamentWinnerInput
    connect?: TournamentWhereUniqueInput
  }

  export type PlayerUpdateOneRequiredWithoutTournamentWinnerNestedInput = {
    create?: XOR<PlayerCreateWithoutTournamentWinnerInput, PlayerUncheckedCreateWithoutTournamentWinnerInput>
    connectOrCreate?: PlayerCreateOrConnectWithoutTournamentWinnerInput
    upsert?: PlayerUpsertWithoutTournamentWinnerInput
    connect?: PlayerWhereUniqueInput
    update?: XOR<XOR<PlayerUpdateToOneWithWhereWithoutTournamentWinnerInput, PlayerUpdateWithoutTournamentWinnerInput>, PlayerUncheckedUpdateWithoutTournamentWinnerInput>
  }

  export type TournamentUpdateOneRequiredWithoutTournamentWinnerNestedInput = {
    create?: XOR<TournamentCreateWithoutTournamentWinnerInput, TournamentUncheckedCreateWithoutTournamentWinnerInput>
    connectOrCreate?: TournamentCreateOrConnectWithoutTournamentWinnerInput
    upsert?: TournamentUpsertWithoutTournamentWinnerInput
    connect?: TournamentWhereUniqueInput
    update?: XOR<XOR<TournamentUpdateToOneWithWhereWithoutTournamentWinnerInput, TournamentUpdateWithoutTournamentWinnerInput>, TournamentUncheckedUpdateWithoutTournamentWinnerInput>
  }

  export type TournamentCreateNestedOneWithoutMatchInput = {
    create?: XOR<TournamentCreateWithoutMatchInput, TournamentUncheckedCreateWithoutMatchInput>
    connectOrCreate?: TournamentCreateOrConnectWithoutMatchInput
    connect?: TournamentWhereUniqueInput
  }

  export type TournamentUpdateOneRequiredWithoutMatchNestedInput = {
    create?: XOR<TournamentCreateWithoutMatchInput, TournamentUncheckedCreateWithoutMatchInput>
    connectOrCreate?: TournamentCreateOrConnectWithoutMatchInput
    upsert?: TournamentUpsertWithoutMatchInput
    connect?: TournamentWhereUniqueInput
    update?: XOR<XOR<TournamentUpdateToOneWithWhereWithoutMatchInput, TournamentUpdateWithoutMatchInput>, TournamentUncheckedUpdateWithoutMatchInput>
  }

  export type PlayerCreateNestedOneWithoutWalletInput = {
    create?: XOR<PlayerCreateWithoutWalletInput, PlayerUncheckedCreateWithoutWalletInput>
    connectOrCreate?: PlayerCreateOrConnectWithoutWalletInput
    connect?: PlayerWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutWalletInput = {
    create?: XOR<UserCreateWithoutWalletInput, UserUncheckedCreateWithoutWalletInput>
    connectOrCreate?: UserCreateOrConnectWithoutWalletInput
    connect?: UserWhereUniqueInput
  }

  export type PlayerUpdateOneWithoutWalletNestedInput = {
    create?: XOR<PlayerCreateWithoutWalletInput, PlayerUncheckedCreateWithoutWalletInput>
    connectOrCreate?: PlayerCreateOrConnectWithoutWalletInput
    upsert?: PlayerUpsertWithoutWalletInput
    disconnect?: PlayerWhereInput | boolean
    delete?: PlayerWhereInput | boolean
    connect?: PlayerWhereUniqueInput
    update?: XOR<XOR<PlayerUpdateToOneWithWhereWithoutWalletInput, PlayerUpdateWithoutWalletInput>, PlayerUncheckedUpdateWithoutWalletInput>
  }

  export type UserUpdateOneRequiredWithoutWalletNestedInput = {
    create?: XOR<UserCreateWithoutWalletInput, UserUncheckedCreateWithoutWalletInput>
    connectOrCreate?: UserCreateOrConnectWithoutWalletInput
    upsert?: UserUpsertWithoutWalletInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutWalletInput, UserUpdateWithoutWalletInput>, UserUncheckedUpdateWithoutWalletInput>
  }

  export type PlayerCreateNestedOneWithoutPlayerStatsInput = {
    create?: XOR<PlayerCreateWithoutPlayerStatsInput, PlayerUncheckedCreateWithoutPlayerStatsInput>
    connectOrCreate?: PlayerCreateOrConnectWithoutPlayerStatsInput
    connect?: PlayerWhereUniqueInput
  }

  export type FloatFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type PlayerUpdateOneRequiredWithoutPlayerStatsNestedInput = {
    create?: XOR<PlayerCreateWithoutPlayerStatsInput, PlayerUncheckedCreateWithoutPlayerStatsInput>
    connectOrCreate?: PlayerCreateOrConnectWithoutPlayerStatsInput
    upsert?: PlayerUpsertWithoutPlayerStatsInput
    connect?: PlayerWhereUniqueInput
    update?: XOR<XOR<PlayerUpdateToOneWithWhereWithoutPlayerStatsInput, PlayerUpdateWithoutPlayerStatsInput>, PlayerUncheckedUpdateWithoutPlayerStatsInput>
  }

  export type PlayerCreateNestedManyWithoutTeamInput = {
    create?: XOR<PlayerCreateWithoutTeamInput, PlayerUncheckedCreateWithoutTeamInput> | PlayerCreateWithoutTeamInput[] | PlayerUncheckedCreateWithoutTeamInput[]
    connectOrCreate?: PlayerCreateOrConnectWithoutTeamInput | PlayerCreateOrConnectWithoutTeamInput[]
    createMany?: PlayerCreateManyTeamInputEnvelope
    connect?: PlayerWhereUniqueInput | PlayerWhereUniqueInput[]
  }

  export type TournamentCreateNestedOneWithoutTeamInput = {
    create?: XOR<TournamentCreateWithoutTeamInput, TournamentUncheckedCreateWithoutTeamInput>
    connectOrCreate?: TournamentCreateOrConnectWithoutTeamInput
    connect?: TournamentWhereUniqueInput
  }

  export type PlayerUncheckedCreateNestedManyWithoutTeamInput = {
    create?: XOR<PlayerCreateWithoutTeamInput, PlayerUncheckedCreateWithoutTeamInput> | PlayerCreateWithoutTeamInput[] | PlayerUncheckedCreateWithoutTeamInput[]
    connectOrCreate?: PlayerCreateOrConnectWithoutTeamInput | PlayerCreateOrConnectWithoutTeamInput[]
    createMany?: PlayerCreateManyTeamInputEnvelope
    connect?: PlayerWhereUniqueInput | PlayerWhereUniqueInput[]
  }

  export type PlayerUpdateManyWithoutTeamNestedInput = {
    create?: XOR<PlayerCreateWithoutTeamInput, PlayerUncheckedCreateWithoutTeamInput> | PlayerCreateWithoutTeamInput[] | PlayerUncheckedCreateWithoutTeamInput[]
    connectOrCreate?: PlayerCreateOrConnectWithoutTeamInput | PlayerCreateOrConnectWithoutTeamInput[]
    upsert?: PlayerUpsertWithWhereUniqueWithoutTeamInput | PlayerUpsertWithWhereUniqueWithoutTeamInput[]
    createMany?: PlayerCreateManyTeamInputEnvelope
    set?: PlayerWhereUniqueInput | PlayerWhereUniqueInput[]
    disconnect?: PlayerWhereUniqueInput | PlayerWhereUniqueInput[]
    delete?: PlayerWhereUniqueInput | PlayerWhereUniqueInput[]
    connect?: PlayerWhereUniqueInput | PlayerWhereUniqueInput[]
    update?: PlayerUpdateWithWhereUniqueWithoutTeamInput | PlayerUpdateWithWhereUniqueWithoutTeamInput[]
    updateMany?: PlayerUpdateManyWithWhereWithoutTeamInput | PlayerUpdateManyWithWhereWithoutTeamInput[]
    deleteMany?: PlayerScalarWhereInput | PlayerScalarWhereInput[]
  }

  export type TournamentUpdateOneWithoutTeamNestedInput = {
    create?: XOR<TournamentCreateWithoutTeamInput, TournamentUncheckedCreateWithoutTeamInput>
    connectOrCreate?: TournamentCreateOrConnectWithoutTeamInput
    upsert?: TournamentUpsertWithoutTeamInput
    disconnect?: TournamentWhereInput | boolean
    delete?: TournamentWhereInput | boolean
    connect?: TournamentWhereUniqueInput
    update?: XOR<XOR<TournamentUpdateToOneWithWhereWithoutTeamInput, TournamentUpdateWithoutTeamInput>, TournamentUncheckedUpdateWithoutTeamInput>
  }

  export type PlayerUncheckedUpdateManyWithoutTeamNestedInput = {
    create?: XOR<PlayerCreateWithoutTeamInput, PlayerUncheckedCreateWithoutTeamInput> | PlayerCreateWithoutTeamInput[] | PlayerUncheckedCreateWithoutTeamInput[]
    connectOrCreate?: PlayerCreateOrConnectWithoutTeamInput | PlayerCreateOrConnectWithoutTeamInput[]
    upsert?: PlayerUpsertWithWhereUniqueWithoutTeamInput | PlayerUpsertWithWhereUniqueWithoutTeamInput[]
    createMany?: PlayerCreateManyTeamInputEnvelope
    set?: PlayerWhereUniqueInput | PlayerWhereUniqueInput[]
    disconnect?: PlayerWhereUniqueInput | PlayerWhereUniqueInput[]
    delete?: PlayerWhereUniqueInput | PlayerWhereUniqueInput[]
    connect?: PlayerWhereUniqueInput | PlayerWhereUniqueInput[]
    update?: PlayerUpdateWithWhereUniqueWithoutTeamInput | PlayerUpdateWithWhereUniqueWithoutTeamInput[]
    updateMany?: PlayerUpdateManyWithWhereWithoutTeamInput | PlayerUpdateManyWithWhereWithoutTeamInput[]
    deleteMany?: PlayerScalarWhereInput | PlayerScalarWhereInput[]
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedEnumRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleFilter<$PrismaModel> | $Enums.Role
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedEnumRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleWithAggregatesFilter<$PrismaModel> | $Enums.Role
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRoleFilter<$PrismaModel>
    _max?: NestedEnumRoleFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedEnumPlayerCategoryFilter<$PrismaModel = never> = {
    equals?: $Enums.PlayerCategory | EnumPlayerCategoryFieldRefInput<$PrismaModel>
    in?: $Enums.PlayerCategory[] | ListEnumPlayerCategoryFieldRefInput<$PrismaModel>
    notIn?: $Enums.PlayerCategory[] | ListEnumPlayerCategoryFieldRefInput<$PrismaModel>
    not?: NestedEnumPlayerCategoryFilter<$PrismaModel> | $Enums.PlayerCategory
  }

  export type NestedEnumPlayerCategoryWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PlayerCategory | EnumPlayerCategoryFieldRefInput<$PrismaModel>
    in?: $Enums.PlayerCategory[] | ListEnumPlayerCategoryFieldRefInput<$PrismaModel>
    notIn?: $Enums.PlayerCategory[] | ListEnumPlayerCategoryFieldRefInput<$PrismaModel>
    not?: NestedEnumPlayerCategoryWithAggregatesFilter<$PrismaModel> | $Enums.PlayerCategory
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPlayerCategoryFilter<$PrismaModel>
    _max?: NestedEnumPlayerCategoryFilter<$PrismaModel>
  }

  export type NestedEnumSeasonStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.SeasonStatus | EnumSeasonStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SeasonStatus[] | ListEnumSeasonStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SeasonStatus[] | ListEnumSeasonStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSeasonStatusFilter<$PrismaModel> | $Enums.SeasonStatus
  }

  export type NestedEnumSeasonStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SeasonStatus | EnumSeasonStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SeasonStatus[] | ListEnumSeasonStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SeasonStatus[] | ListEnumSeasonStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSeasonStatusWithAggregatesFilter<$PrismaModel> | $Enums.SeasonStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSeasonStatusFilter<$PrismaModel>
    _max?: NestedEnumSeasonStatusFilter<$PrismaModel>
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumVoteFilter<$PrismaModel = never> = {
    equals?: $Enums.Vote | EnumVoteFieldRefInput<$PrismaModel>
    in?: $Enums.Vote[] | ListEnumVoteFieldRefInput<$PrismaModel>
    notIn?: $Enums.Vote[] | ListEnumVoteFieldRefInput<$PrismaModel>
    not?: NestedEnumVoteFilter<$PrismaModel> | $Enums.Vote
  }

  export type NestedEnumVoteWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Vote | EnumVoteFieldRefInput<$PrismaModel>
    in?: $Enums.Vote[] | ListEnumVoteFieldRefInput<$PrismaModel>
    notIn?: $Enums.Vote[] | ListEnumVoteFieldRefInput<$PrismaModel>
    not?: NestedEnumVoteWithAggregatesFilter<$PrismaModel> | $Enums.Vote
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumVoteFilter<$PrismaModel>
    _max?: NestedEnumVoteFilter<$PrismaModel>
  }

  export type NestedFloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type PlayerCreateWithoutUserInput = {
    id?: string
    isBanned?: boolean
    category?: $Enums.PlayerCategory
    gameScore?: GameScoreCreateNestedManyWithoutPlayerInput
    pollVote?: PollVoteCreateNestedOneWithoutPlayerInput
    tournamentWinner?: TournamentWinnerCreateNestedManyWithoutPlayerInput
    Wallet?: WalletCreateNestedOneWithoutPlayerInput
    playerStats?: PlayerStatsCreateNestedOneWithoutPlayerInput
    team?: TeamCreateNestedOneWithoutPlayersInput
    characterImage?: GalleryCreateNestedOneWithoutPlayerInput
  }

  export type PlayerUncheckedCreateWithoutUserInput = {
    id?: string
    isBanned?: boolean
    category?: $Enums.PlayerCategory
    teamId?: string | null
    characterImageId?: string | null
    gameScore?: GameScoreUncheckedCreateNestedManyWithoutPlayerInput
    pollVote?: PollVoteUncheckedCreateNestedOneWithoutPlayerInput
    tournamentWinner?: TournamentWinnerUncheckedCreateNestedManyWithoutPlayerInput
    Wallet?: WalletUncheckedCreateNestedOneWithoutPlayerInput
    playerStats?: PlayerStatsUncheckedCreateNestedOneWithoutPlayerInput
  }

  export type PlayerCreateOrConnectWithoutUserInput = {
    where: PlayerWhereUniqueInput
    create: XOR<PlayerCreateWithoutUserInput, PlayerUncheckedCreateWithoutUserInput>
  }

  export type TournamentCreateWithoutUserInput = {
    id?: string
    name: string
    startDate: Date | string
    fee?: number | null
    createdBy?: string | null
    createdAt?: Date | string
    team?: TeamCreateNestedManyWithoutTournamentInput
    season?: SeasonCreateNestedOneWithoutTournamentInput
    tournamentWinner?: TournamentWinnerCreateNestedManyWithoutTournamentInput
    pollVote?: PollVoteCreateNestedManyWithoutTournamentInput
    match?: MatchCreateNestedManyWithoutTournamentInput
    gallery?: GalleryCreateNestedOneWithoutTournamentInput
  }

  export type TournamentUncheckedCreateWithoutUserInput = {
    id?: string
    name: string
    startDate: Date | string
    fee?: number | null
    seasonId?: string | null
    createdBy?: string | null
    createdAt?: Date | string
    galleryId?: string | null
    team?: TeamUncheckedCreateNestedManyWithoutTournamentInput
    tournamentWinner?: TournamentWinnerUncheckedCreateNestedManyWithoutTournamentInput
    pollVote?: PollVoteUncheckedCreateNestedManyWithoutTournamentInput
    match?: MatchUncheckedCreateNestedManyWithoutTournamentInput
  }

  export type TournamentCreateOrConnectWithoutUserInput = {
    where: TournamentWhereUniqueInput
    create: XOR<TournamentCreateWithoutUserInput, TournamentUncheckedCreateWithoutUserInput>
  }

  export type WalletCreateWithoutUserInput = {
    id?: string
    amount: number
    createdAt?: Date | string
    player?: PlayerCreateNestedOneWithoutWalletInput
  }

  export type WalletUncheckedCreateWithoutUserInput = {
    id?: string
    amount: number
    createdAt?: Date | string
    playerId?: string | null
  }

  export type WalletCreateOrConnectWithoutUserInput = {
    where: WalletWhereUniqueInput
    create: XOR<WalletCreateWithoutUserInput, WalletUncheckedCreateWithoutUserInput>
  }

  export type PlayerUpsertWithoutUserInput = {
    update: XOR<PlayerUpdateWithoutUserInput, PlayerUncheckedUpdateWithoutUserInput>
    create: XOR<PlayerCreateWithoutUserInput, PlayerUncheckedCreateWithoutUserInput>
    where?: PlayerWhereInput
  }

  export type PlayerUpdateToOneWithWhereWithoutUserInput = {
    where?: PlayerWhereInput
    data: XOR<PlayerUpdateWithoutUserInput, PlayerUncheckedUpdateWithoutUserInput>
  }

  export type PlayerUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    category?: EnumPlayerCategoryFieldUpdateOperationsInput | $Enums.PlayerCategory
    gameScore?: GameScoreUpdateManyWithoutPlayerNestedInput
    pollVote?: PollVoteUpdateOneWithoutPlayerNestedInput
    tournamentWinner?: TournamentWinnerUpdateManyWithoutPlayerNestedInput
    Wallet?: WalletUpdateOneWithoutPlayerNestedInput
    playerStats?: PlayerStatsUpdateOneWithoutPlayerNestedInput
    team?: TeamUpdateOneWithoutPlayersNestedInput
    characterImage?: GalleryUpdateOneWithoutPlayerNestedInput
  }

  export type PlayerUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    category?: EnumPlayerCategoryFieldUpdateOperationsInput | $Enums.PlayerCategory
    teamId?: NullableStringFieldUpdateOperationsInput | string | null
    characterImageId?: NullableStringFieldUpdateOperationsInput | string | null
    gameScore?: GameScoreUncheckedUpdateManyWithoutPlayerNestedInput
    pollVote?: PollVoteUncheckedUpdateOneWithoutPlayerNestedInput
    tournamentWinner?: TournamentWinnerUncheckedUpdateManyWithoutPlayerNestedInput
    Wallet?: WalletUncheckedUpdateOneWithoutPlayerNestedInput
    playerStats?: PlayerStatsUncheckedUpdateOneWithoutPlayerNestedInput
  }

  export type TournamentUpsertWithoutUserInput = {
    update: XOR<TournamentUpdateWithoutUserInput, TournamentUncheckedUpdateWithoutUserInput>
    create: XOR<TournamentCreateWithoutUserInput, TournamentUncheckedCreateWithoutUserInput>
    where?: TournamentWhereInput
  }

  export type TournamentUpdateToOneWithWhereWithoutUserInput = {
    where?: TournamentWhereInput
    data: XOR<TournamentUpdateWithoutUserInput, TournamentUncheckedUpdateWithoutUserInput>
  }

  export type TournamentUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    fee?: NullableIntFieldUpdateOperationsInput | number | null
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    team?: TeamUpdateManyWithoutTournamentNestedInput
    season?: SeasonUpdateOneWithoutTournamentNestedInput
    tournamentWinner?: TournamentWinnerUpdateManyWithoutTournamentNestedInput
    pollVote?: PollVoteUpdateManyWithoutTournamentNestedInput
    match?: MatchUpdateManyWithoutTournamentNestedInput
    gallery?: GalleryUpdateOneWithoutTournamentNestedInput
  }

  export type TournamentUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    fee?: NullableIntFieldUpdateOperationsInput | number | null
    seasonId?: NullableStringFieldUpdateOperationsInput | string | null
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    galleryId?: NullableStringFieldUpdateOperationsInput | string | null
    team?: TeamUncheckedUpdateManyWithoutTournamentNestedInput
    tournamentWinner?: TournamentWinnerUncheckedUpdateManyWithoutTournamentNestedInput
    pollVote?: PollVoteUncheckedUpdateManyWithoutTournamentNestedInput
    match?: MatchUncheckedUpdateManyWithoutTournamentNestedInput
  }

  export type WalletUpsertWithoutUserInput = {
    update: XOR<WalletUpdateWithoutUserInput, WalletUncheckedUpdateWithoutUserInput>
    create: XOR<WalletCreateWithoutUserInput, WalletUncheckedCreateWithoutUserInput>
    where?: WalletWhereInput
  }

  export type WalletUpdateToOneWithWhereWithoutUserInput = {
    where?: WalletWhereInput
    data: XOR<WalletUpdateWithoutUserInput, WalletUncheckedUpdateWithoutUserInput>
  }

  export type WalletUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    amount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    player?: PlayerUpdateOneWithoutWalletNestedInput
  }

  export type WalletUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    amount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    playerId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type GameScoreCreateWithoutPlayerInput = {
    highScore: number
    lastPlayedAt: Date | string
  }

  export type GameScoreUncheckedCreateWithoutPlayerInput = {
    highScore: number
    lastPlayedAt: Date | string
  }

  export type GameScoreCreateOrConnectWithoutPlayerInput = {
    where: GameScoreWhereUniqueInput
    create: XOR<GameScoreCreateWithoutPlayerInput, GameScoreUncheckedCreateWithoutPlayerInput>
  }

  export type GameScoreCreateManyPlayerInputEnvelope = {
    data: GameScoreCreateManyPlayerInput | GameScoreCreateManyPlayerInput[]
    skipDuplicates?: boolean
  }

  export type PollVoteCreateWithoutPlayerInput = {
    id?: string
    vote: $Enums.Vote
    inOption: string
    outOption: string
    soloOption: string
    startDate: Date | string
    endDate: Date | string
    createdAt?: Date | string
    tournament: TournamentCreateNestedOneWithoutPollVoteInput
  }

  export type PollVoteUncheckedCreateWithoutPlayerInput = {
    id?: string
    vote: $Enums.Vote
    inOption: string
    outOption: string
    soloOption: string
    startDate: Date | string
    endDate: Date | string
    tournamentId: string
    createdAt?: Date | string
  }

  export type PollVoteCreateOrConnectWithoutPlayerInput = {
    where: PollVoteWhereUniqueInput
    create: XOR<PollVoteCreateWithoutPlayerInput, PollVoteUncheckedCreateWithoutPlayerInput>
  }

  export type UserCreateWithoutPlayerInput = {
    id?: string
    email?: string | null
    clerkId: string
    isEmailLinked?: boolean
    userName: string
    usernameLastChangeAt?: Date | string
    role?: $Enums.Role
    balance?: number
    isInternal?: boolean
    isVerified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    playerId?: string | null
    tournament?: TournamentCreateNestedOneWithoutUserInput
    wallet?: WalletCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateWithoutPlayerInput = {
    id?: string
    email?: string | null
    clerkId: string
    isEmailLinked?: boolean
    userName: string
    usernameLastChangeAt?: Date | string
    role?: $Enums.Role
    balance?: number
    isInternal?: boolean
    isVerified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    playerId?: string | null
    tournamentId?: string | null
    wallet?: WalletUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserCreateOrConnectWithoutPlayerInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutPlayerInput, UserUncheckedCreateWithoutPlayerInput>
  }

  export type TournamentWinnerCreateWithoutPlayerInput = {
    id?: string
    position: number
    createdAt?: Date | string
    tournament: TournamentCreateNestedOneWithoutTournamentWinnerInput
  }

  export type TournamentWinnerUncheckedCreateWithoutPlayerInput = {
    id?: string
    position: number
    tournamentId: string
    createdAt?: Date | string
  }

  export type TournamentWinnerCreateOrConnectWithoutPlayerInput = {
    where: TournamentWinnerWhereUniqueInput
    create: XOR<TournamentWinnerCreateWithoutPlayerInput, TournamentWinnerUncheckedCreateWithoutPlayerInput>
  }

  export type TournamentWinnerCreateManyPlayerInputEnvelope = {
    data: TournamentWinnerCreateManyPlayerInput | TournamentWinnerCreateManyPlayerInput[]
    skipDuplicates?: boolean
  }

  export type WalletCreateWithoutPlayerInput = {
    id?: string
    amount: number
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutWalletInput
  }

  export type WalletUncheckedCreateWithoutPlayerInput = {
    id?: string
    amount: number
    createdAt?: Date | string
    userId: string
  }

  export type WalletCreateOrConnectWithoutPlayerInput = {
    where: WalletWhereUniqueInput
    create: XOR<WalletCreateWithoutPlayerInput, WalletUncheckedCreateWithoutPlayerInput>
  }

  export type PlayerStatsCreateWithoutPlayerInput = {
    id?: string
    matches: number
    wins: number
    deaths: number
    kills: number
    kd: number
    createdAt?: Date | string
  }

  export type PlayerStatsUncheckedCreateWithoutPlayerInput = {
    id?: string
    matches: number
    wins: number
    deaths: number
    kills: number
    kd: number
    createdAt?: Date | string
  }

  export type PlayerStatsCreateOrConnectWithoutPlayerInput = {
    where: PlayerStatsWhereUniqueInput
    create: XOR<PlayerStatsCreateWithoutPlayerInput, PlayerStatsUncheckedCreateWithoutPlayerInput>
  }

  export type TeamCreateWithoutPlayersInput = {
    id?: string
    name: string
    createdAt?: Date | string
    teamNumber: number
    playerStatsId?: string | null
    tournament?: TournamentCreateNestedOneWithoutTeamInput
  }

  export type TeamUncheckedCreateWithoutPlayersInput = {
    id?: string
    name: string
    createdAt?: Date | string
    teamNumber: number
    playerStatsId?: string | null
    tournamentId?: string | null
  }

  export type TeamCreateOrConnectWithoutPlayersInput = {
    where: TeamWhereUniqueInput
    create: XOR<TeamCreateWithoutPlayersInput, TeamUncheckedCreateWithoutPlayersInput>
  }

  export type GalleryCreateWithoutPlayerInput = {
    id?: string
    imageId: string
    name: string
    path: string
    fullPath: string
    publicUrl: string
    isCharacterImg?: boolean
    playerId?: string | null
    tournament?: TournamentCreateNestedManyWithoutGalleryInput
  }

  export type GalleryUncheckedCreateWithoutPlayerInput = {
    id?: string
    imageId: string
    name: string
    path: string
    fullPath: string
    publicUrl: string
    isCharacterImg?: boolean
    playerId?: string | null
    tournament?: TournamentUncheckedCreateNestedManyWithoutGalleryInput
  }

  export type GalleryCreateOrConnectWithoutPlayerInput = {
    where: GalleryWhereUniqueInput
    create: XOR<GalleryCreateWithoutPlayerInput, GalleryUncheckedCreateWithoutPlayerInput>
  }

  export type GameScoreUpsertWithWhereUniqueWithoutPlayerInput = {
    where: GameScoreWhereUniqueInput
    update: XOR<GameScoreUpdateWithoutPlayerInput, GameScoreUncheckedUpdateWithoutPlayerInput>
    create: XOR<GameScoreCreateWithoutPlayerInput, GameScoreUncheckedCreateWithoutPlayerInput>
  }

  export type GameScoreUpdateWithWhereUniqueWithoutPlayerInput = {
    where: GameScoreWhereUniqueInput
    data: XOR<GameScoreUpdateWithoutPlayerInput, GameScoreUncheckedUpdateWithoutPlayerInput>
  }

  export type GameScoreUpdateManyWithWhereWithoutPlayerInput = {
    where: GameScoreScalarWhereInput
    data: XOR<GameScoreUpdateManyMutationInput, GameScoreUncheckedUpdateManyWithoutPlayerInput>
  }

  export type GameScoreScalarWhereInput = {
    AND?: GameScoreScalarWhereInput | GameScoreScalarWhereInput[]
    OR?: GameScoreScalarWhereInput[]
    NOT?: GameScoreScalarWhereInput | GameScoreScalarWhereInput[]
    highScore?: IntFilter<"GameScore"> | number
    lastPlayedAt?: DateTimeFilter<"GameScore"> | Date | string
    playerId?: StringFilter<"GameScore"> | string
  }

  export type PollVoteUpsertWithoutPlayerInput = {
    update: XOR<PollVoteUpdateWithoutPlayerInput, PollVoteUncheckedUpdateWithoutPlayerInput>
    create: XOR<PollVoteCreateWithoutPlayerInput, PollVoteUncheckedCreateWithoutPlayerInput>
    where?: PollVoteWhereInput
  }

  export type PollVoteUpdateToOneWithWhereWithoutPlayerInput = {
    where?: PollVoteWhereInput
    data: XOR<PollVoteUpdateWithoutPlayerInput, PollVoteUncheckedUpdateWithoutPlayerInput>
  }

  export type PollVoteUpdateWithoutPlayerInput = {
    id?: StringFieldUpdateOperationsInput | string
    vote?: EnumVoteFieldUpdateOperationsInput | $Enums.Vote
    inOption?: StringFieldUpdateOperationsInput | string
    outOption?: StringFieldUpdateOperationsInput | string
    soloOption?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    tournament?: TournamentUpdateOneRequiredWithoutPollVoteNestedInput
  }

  export type PollVoteUncheckedUpdateWithoutPlayerInput = {
    id?: StringFieldUpdateOperationsInput | string
    vote?: EnumVoteFieldUpdateOperationsInput | $Enums.Vote
    inOption?: StringFieldUpdateOperationsInput | string
    outOption?: StringFieldUpdateOperationsInput | string
    soloOption?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    tournamentId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUpsertWithoutPlayerInput = {
    update: XOR<UserUpdateWithoutPlayerInput, UserUncheckedUpdateWithoutPlayerInput>
    create: XOR<UserCreateWithoutPlayerInput, UserUncheckedCreateWithoutPlayerInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutPlayerInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutPlayerInput, UserUncheckedUpdateWithoutPlayerInput>
  }

  export type UserUpdateWithoutPlayerInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    clerkId?: StringFieldUpdateOperationsInput | string
    isEmailLinked?: BoolFieldUpdateOperationsInput | boolean
    userName?: StringFieldUpdateOperationsInput | string
    usernameLastChangeAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    balance?: IntFieldUpdateOperationsInput | number
    isInternal?: BoolFieldUpdateOperationsInput | boolean
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    playerId?: NullableStringFieldUpdateOperationsInput | string | null
    tournament?: TournamentUpdateOneWithoutUserNestedInput
    wallet?: WalletUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutPlayerInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    clerkId?: StringFieldUpdateOperationsInput | string
    isEmailLinked?: BoolFieldUpdateOperationsInput | boolean
    userName?: StringFieldUpdateOperationsInput | string
    usernameLastChangeAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    balance?: IntFieldUpdateOperationsInput | number
    isInternal?: BoolFieldUpdateOperationsInput | boolean
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    playerId?: NullableStringFieldUpdateOperationsInput | string | null
    tournamentId?: NullableStringFieldUpdateOperationsInput | string | null
    wallet?: WalletUncheckedUpdateOneWithoutUserNestedInput
  }

  export type TournamentWinnerUpsertWithWhereUniqueWithoutPlayerInput = {
    where: TournamentWinnerWhereUniqueInput
    update: XOR<TournamentWinnerUpdateWithoutPlayerInput, TournamentWinnerUncheckedUpdateWithoutPlayerInput>
    create: XOR<TournamentWinnerCreateWithoutPlayerInput, TournamentWinnerUncheckedCreateWithoutPlayerInput>
  }

  export type TournamentWinnerUpdateWithWhereUniqueWithoutPlayerInput = {
    where: TournamentWinnerWhereUniqueInput
    data: XOR<TournamentWinnerUpdateWithoutPlayerInput, TournamentWinnerUncheckedUpdateWithoutPlayerInput>
  }

  export type TournamentWinnerUpdateManyWithWhereWithoutPlayerInput = {
    where: TournamentWinnerScalarWhereInput
    data: XOR<TournamentWinnerUpdateManyMutationInput, TournamentWinnerUncheckedUpdateManyWithoutPlayerInput>
  }

  export type TournamentWinnerScalarWhereInput = {
    AND?: TournamentWinnerScalarWhereInput | TournamentWinnerScalarWhereInput[]
    OR?: TournamentWinnerScalarWhereInput[]
    NOT?: TournamentWinnerScalarWhereInput | TournamentWinnerScalarWhereInput[]
    id?: StringFilter<"TournamentWinner"> | string
    playerId?: StringFilter<"TournamentWinner"> | string
    position?: IntFilter<"TournamentWinner"> | number
    tournamentId?: StringFilter<"TournamentWinner"> | string
    createdAt?: DateTimeFilter<"TournamentWinner"> | Date | string
  }

  export type WalletUpsertWithoutPlayerInput = {
    update: XOR<WalletUpdateWithoutPlayerInput, WalletUncheckedUpdateWithoutPlayerInput>
    create: XOR<WalletCreateWithoutPlayerInput, WalletUncheckedCreateWithoutPlayerInput>
    where?: WalletWhereInput
  }

  export type WalletUpdateToOneWithWhereWithoutPlayerInput = {
    where?: WalletWhereInput
    data: XOR<WalletUpdateWithoutPlayerInput, WalletUncheckedUpdateWithoutPlayerInput>
  }

  export type WalletUpdateWithoutPlayerInput = {
    id?: StringFieldUpdateOperationsInput | string
    amount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutWalletNestedInput
  }

  export type WalletUncheckedUpdateWithoutPlayerInput = {
    id?: StringFieldUpdateOperationsInput | string
    amount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type PlayerStatsUpsertWithoutPlayerInput = {
    update: XOR<PlayerStatsUpdateWithoutPlayerInput, PlayerStatsUncheckedUpdateWithoutPlayerInput>
    create: XOR<PlayerStatsCreateWithoutPlayerInput, PlayerStatsUncheckedCreateWithoutPlayerInput>
    where?: PlayerStatsWhereInput
  }

  export type PlayerStatsUpdateToOneWithWhereWithoutPlayerInput = {
    where?: PlayerStatsWhereInput
    data: XOR<PlayerStatsUpdateWithoutPlayerInput, PlayerStatsUncheckedUpdateWithoutPlayerInput>
  }

  export type PlayerStatsUpdateWithoutPlayerInput = {
    id?: StringFieldUpdateOperationsInput | string
    matches?: IntFieldUpdateOperationsInput | number
    wins?: IntFieldUpdateOperationsInput | number
    deaths?: IntFieldUpdateOperationsInput | number
    kills?: IntFieldUpdateOperationsInput | number
    kd?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PlayerStatsUncheckedUpdateWithoutPlayerInput = {
    id?: StringFieldUpdateOperationsInput | string
    matches?: IntFieldUpdateOperationsInput | number
    wins?: IntFieldUpdateOperationsInput | number
    deaths?: IntFieldUpdateOperationsInput | number
    kills?: IntFieldUpdateOperationsInput | number
    kd?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TeamUpsertWithoutPlayersInput = {
    update: XOR<TeamUpdateWithoutPlayersInput, TeamUncheckedUpdateWithoutPlayersInput>
    create: XOR<TeamCreateWithoutPlayersInput, TeamUncheckedCreateWithoutPlayersInput>
    where?: TeamWhereInput
  }

  export type TeamUpdateToOneWithWhereWithoutPlayersInput = {
    where?: TeamWhereInput
    data: XOR<TeamUpdateWithoutPlayersInput, TeamUncheckedUpdateWithoutPlayersInput>
  }

  export type TeamUpdateWithoutPlayersInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    teamNumber?: IntFieldUpdateOperationsInput | number
    playerStatsId?: NullableStringFieldUpdateOperationsInput | string | null
    tournament?: TournamentUpdateOneWithoutTeamNestedInput
  }

  export type TeamUncheckedUpdateWithoutPlayersInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    teamNumber?: IntFieldUpdateOperationsInput | number
    playerStatsId?: NullableStringFieldUpdateOperationsInput | string | null
    tournamentId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type GalleryUpsertWithoutPlayerInput = {
    update: XOR<GalleryUpdateWithoutPlayerInput, GalleryUncheckedUpdateWithoutPlayerInput>
    create: XOR<GalleryCreateWithoutPlayerInput, GalleryUncheckedCreateWithoutPlayerInput>
    where?: GalleryWhereInput
  }

  export type GalleryUpdateToOneWithWhereWithoutPlayerInput = {
    where?: GalleryWhereInput
    data: XOR<GalleryUpdateWithoutPlayerInput, GalleryUncheckedUpdateWithoutPlayerInput>
  }

  export type GalleryUpdateWithoutPlayerInput = {
    id?: StringFieldUpdateOperationsInput | string
    imageId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    path?: StringFieldUpdateOperationsInput | string
    fullPath?: StringFieldUpdateOperationsInput | string
    publicUrl?: StringFieldUpdateOperationsInput | string
    isCharacterImg?: BoolFieldUpdateOperationsInput | boolean
    playerId?: NullableStringFieldUpdateOperationsInput | string | null
    tournament?: TournamentUpdateManyWithoutGalleryNestedInput
  }

  export type GalleryUncheckedUpdateWithoutPlayerInput = {
    id?: StringFieldUpdateOperationsInput | string
    imageId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    path?: StringFieldUpdateOperationsInput | string
    fullPath?: StringFieldUpdateOperationsInput | string
    publicUrl?: StringFieldUpdateOperationsInput | string
    isCharacterImg?: BoolFieldUpdateOperationsInput | boolean
    playerId?: NullableStringFieldUpdateOperationsInput | string | null
    tournament?: TournamentUncheckedUpdateManyWithoutGalleryNestedInput
  }

  export type PlayerCreateWithoutGameScoreInput = {
    id?: string
    isBanned?: boolean
    category?: $Enums.PlayerCategory
    pollVote?: PollVoteCreateNestedOneWithoutPlayerInput
    user: UserCreateNestedOneWithoutPlayerInput
    tournamentWinner?: TournamentWinnerCreateNestedManyWithoutPlayerInput
    Wallet?: WalletCreateNestedOneWithoutPlayerInput
    playerStats?: PlayerStatsCreateNestedOneWithoutPlayerInput
    team?: TeamCreateNestedOneWithoutPlayersInput
    characterImage?: GalleryCreateNestedOneWithoutPlayerInput
  }

  export type PlayerUncheckedCreateWithoutGameScoreInput = {
    id?: string
    isBanned?: boolean
    category?: $Enums.PlayerCategory
    userId: string
    teamId?: string | null
    characterImageId?: string | null
    pollVote?: PollVoteUncheckedCreateNestedOneWithoutPlayerInput
    tournamentWinner?: TournamentWinnerUncheckedCreateNestedManyWithoutPlayerInput
    Wallet?: WalletUncheckedCreateNestedOneWithoutPlayerInput
    playerStats?: PlayerStatsUncheckedCreateNestedOneWithoutPlayerInput
  }

  export type PlayerCreateOrConnectWithoutGameScoreInput = {
    where: PlayerWhereUniqueInput
    create: XOR<PlayerCreateWithoutGameScoreInput, PlayerUncheckedCreateWithoutGameScoreInput>
  }

  export type PlayerUpsertWithoutGameScoreInput = {
    update: XOR<PlayerUpdateWithoutGameScoreInput, PlayerUncheckedUpdateWithoutGameScoreInput>
    create: XOR<PlayerCreateWithoutGameScoreInput, PlayerUncheckedCreateWithoutGameScoreInput>
    where?: PlayerWhereInput
  }

  export type PlayerUpdateToOneWithWhereWithoutGameScoreInput = {
    where?: PlayerWhereInput
    data: XOR<PlayerUpdateWithoutGameScoreInput, PlayerUncheckedUpdateWithoutGameScoreInput>
  }

  export type PlayerUpdateWithoutGameScoreInput = {
    id?: StringFieldUpdateOperationsInput | string
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    category?: EnumPlayerCategoryFieldUpdateOperationsInput | $Enums.PlayerCategory
    pollVote?: PollVoteUpdateOneWithoutPlayerNestedInput
    user?: UserUpdateOneRequiredWithoutPlayerNestedInput
    tournamentWinner?: TournamentWinnerUpdateManyWithoutPlayerNestedInput
    Wallet?: WalletUpdateOneWithoutPlayerNestedInput
    playerStats?: PlayerStatsUpdateOneWithoutPlayerNestedInput
    team?: TeamUpdateOneWithoutPlayersNestedInput
    characterImage?: GalleryUpdateOneWithoutPlayerNestedInput
  }

  export type PlayerUncheckedUpdateWithoutGameScoreInput = {
    id?: StringFieldUpdateOperationsInput | string
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    category?: EnumPlayerCategoryFieldUpdateOperationsInput | $Enums.PlayerCategory
    userId?: StringFieldUpdateOperationsInput | string
    teamId?: NullableStringFieldUpdateOperationsInput | string | null
    characterImageId?: NullableStringFieldUpdateOperationsInput | string | null
    pollVote?: PollVoteUncheckedUpdateOneWithoutPlayerNestedInput
    tournamentWinner?: TournamentWinnerUncheckedUpdateManyWithoutPlayerNestedInput
    Wallet?: WalletUncheckedUpdateOneWithoutPlayerNestedInput
    playerStats?: PlayerStatsUncheckedUpdateOneWithoutPlayerNestedInput
  }

  export type PlayerCreateWithoutCharacterImageInput = {
    id?: string
    isBanned?: boolean
    category?: $Enums.PlayerCategory
    gameScore?: GameScoreCreateNestedManyWithoutPlayerInput
    pollVote?: PollVoteCreateNestedOneWithoutPlayerInput
    user: UserCreateNestedOneWithoutPlayerInput
    tournamentWinner?: TournamentWinnerCreateNestedManyWithoutPlayerInput
    Wallet?: WalletCreateNestedOneWithoutPlayerInput
    playerStats?: PlayerStatsCreateNestedOneWithoutPlayerInput
    team?: TeamCreateNestedOneWithoutPlayersInput
  }

  export type PlayerUncheckedCreateWithoutCharacterImageInput = {
    id?: string
    isBanned?: boolean
    category?: $Enums.PlayerCategory
    userId: string
    teamId?: string | null
    gameScore?: GameScoreUncheckedCreateNestedManyWithoutPlayerInput
    pollVote?: PollVoteUncheckedCreateNestedOneWithoutPlayerInput
    tournamentWinner?: TournamentWinnerUncheckedCreateNestedManyWithoutPlayerInput
    Wallet?: WalletUncheckedCreateNestedOneWithoutPlayerInput
    playerStats?: PlayerStatsUncheckedCreateNestedOneWithoutPlayerInput
  }

  export type PlayerCreateOrConnectWithoutCharacterImageInput = {
    where: PlayerWhereUniqueInput
    create: XOR<PlayerCreateWithoutCharacterImageInput, PlayerUncheckedCreateWithoutCharacterImageInput>
  }

  export type TournamentCreateWithoutGalleryInput = {
    id?: string
    name: string
    startDate: Date | string
    fee?: number | null
    createdBy?: string | null
    createdAt?: Date | string
    team?: TeamCreateNestedManyWithoutTournamentInput
    user?: UserCreateNestedManyWithoutTournamentInput
    season?: SeasonCreateNestedOneWithoutTournamentInput
    tournamentWinner?: TournamentWinnerCreateNestedManyWithoutTournamentInput
    pollVote?: PollVoteCreateNestedManyWithoutTournamentInput
    match?: MatchCreateNestedManyWithoutTournamentInput
  }

  export type TournamentUncheckedCreateWithoutGalleryInput = {
    id?: string
    name: string
    startDate: Date | string
    fee?: number | null
    seasonId?: string | null
    createdBy?: string | null
    createdAt?: Date | string
    team?: TeamUncheckedCreateNestedManyWithoutTournamentInput
    user?: UserUncheckedCreateNestedManyWithoutTournamentInput
    tournamentWinner?: TournamentWinnerUncheckedCreateNestedManyWithoutTournamentInput
    pollVote?: PollVoteUncheckedCreateNestedManyWithoutTournamentInput
    match?: MatchUncheckedCreateNestedManyWithoutTournamentInput
  }

  export type TournamentCreateOrConnectWithoutGalleryInput = {
    where: TournamentWhereUniqueInput
    create: XOR<TournamentCreateWithoutGalleryInput, TournamentUncheckedCreateWithoutGalleryInput>
  }

  export type TournamentCreateManyGalleryInputEnvelope = {
    data: TournamentCreateManyGalleryInput | TournamentCreateManyGalleryInput[]
    skipDuplicates?: boolean
  }

  export type PlayerUpsertWithoutCharacterImageInput = {
    update: XOR<PlayerUpdateWithoutCharacterImageInput, PlayerUncheckedUpdateWithoutCharacterImageInput>
    create: XOR<PlayerCreateWithoutCharacterImageInput, PlayerUncheckedCreateWithoutCharacterImageInput>
    where?: PlayerWhereInput
  }

  export type PlayerUpdateToOneWithWhereWithoutCharacterImageInput = {
    where?: PlayerWhereInput
    data: XOR<PlayerUpdateWithoutCharacterImageInput, PlayerUncheckedUpdateWithoutCharacterImageInput>
  }

  export type PlayerUpdateWithoutCharacterImageInput = {
    id?: StringFieldUpdateOperationsInput | string
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    category?: EnumPlayerCategoryFieldUpdateOperationsInput | $Enums.PlayerCategory
    gameScore?: GameScoreUpdateManyWithoutPlayerNestedInput
    pollVote?: PollVoteUpdateOneWithoutPlayerNestedInput
    user?: UserUpdateOneRequiredWithoutPlayerNestedInput
    tournamentWinner?: TournamentWinnerUpdateManyWithoutPlayerNestedInput
    Wallet?: WalletUpdateOneWithoutPlayerNestedInput
    playerStats?: PlayerStatsUpdateOneWithoutPlayerNestedInput
    team?: TeamUpdateOneWithoutPlayersNestedInput
  }

  export type PlayerUncheckedUpdateWithoutCharacterImageInput = {
    id?: StringFieldUpdateOperationsInput | string
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    category?: EnumPlayerCategoryFieldUpdateOperationsInput | $Enums.PlayerCategory
    userId?: StringFieldUpdateOperationsInput | string
    teamId?: NullableStringFieldUpdateOperationsInput | string | null
    gameScore?: GameScoreUncheckedUpdateManyWithoutPlayerNestedInput
    pollVote?: PollVoteUncheckedUpdateOneWithoutPlayerNestedInput
    tournamentWinner?: TournamentWinnerUncheckedUpdateManyWithoutPlayerNestedInput
    Wallet?: WalletUncheckedUpdateOneWithoutPlayerNestedInput
    playerStats?: PlayerStatsUncheckedUpdateOneWithoutPlayerNestedInput
  }

  export type TournamentUpsertWithWhereUniqueWithoutGalleryInput = {
    where: TournamentWhereUniqueInput
    update: XOR<TournamentUpdateWithoutGalleryInput, TournamentUncheckedUpdateWithoutGalleryInput>
    create: XOR<TournamentCreateWithoutGalleryInput, TournamentUncheckedCreateWithoutGalleryInput>
  }

  export type TournamentUpdateWithWhereUniqueWithoutGalleryInput = {
    where: TournamentWhereUniqueInput
    data: XOR<TournamentUpdateWithoutGalleryInput, TournamentUncheckedUpdateWithoutGalleryInput>
  }

  export type TournamentUpdateManyWithWhereWithoutGalleryInput = {
    where: TournamentScalarWhereInput
    data: XOR<TournamentUpdateManyMutationInput, TournamentUncheckedUpdateManyWithoutGalleryInput>
  }

  export type TournamentScalarWhereInput = {
    AND?: TournamentScalarWhereInput | TournamentScalarWhereInput[]
    OR?: TournamentScalarWhereInput[]
    NOT?: TournamentScalarWhereInput | TournamentScalarWhereInput[]
    id?: StringFilter<"Tournament"> | string
    name?: StringFilter<"Tournament"> | string
    startDate?: DateTimeFilter<"Tournament"> | Date | string
    fee?: IntNullableFilter<"Tournament"> | number | null
    seasonId?: StringNullableFilter<"Tournament"> | string | null
    createdBy?: StringNullableFilter<"Tournament"> | string | null
    createdAt?: DateTimeFilter<"Tournament"> | Date | string
    galleryId?: StringNullableFilter<"Tournament"> | string | null
  }

  export type TournamentCreateWithoutSeasonInput = {
    id?: string
    name: string
    startDate: Date | string
    fee?: number | null
    createdBy?: string | null
    createdAt?: Date | string
    team?: TeamCreateNestedManyWithoutTournamentInput
    user?: UserCreateNestedManyWithoutTournamentInput
    tournamentWinner?: TournamentWinnerCreateNestedManyWithoutTournamentInput
    pollVote?: PollVoteCreateNestedManyWithoutTournamentInput
    match?: MatchCreateNestedManyWithoutTournamentInput
    gallery?: GalleryCreateNestedOneWithoutTournamentInput
  }

  export type TournamentUncheckedCreateWithoutSeasonInput = {
    id?: string
    name: string
    startDate: Date | string
    fee?: number | null
    createdBy?: string | null
    createdAt?: Date | string
    galleryId?: string | null
    team?: TeamUncheckedCreateNestedManyWithoutTournamentInput
    user?: UserUncheckedCreateNestedManyWithoutTournamentInput
    tournamentWinner?: TournamentWinnerUncheckedCreateNestedManyWithoutTournamentInput
    pollVote?: PollVoteUncheckedCreateNestedManyWithoutTournamentInput
    match?: MatchUncheckedCreateNestedManyWithoutTournamentInput
  }

  export type TournamentCreateOrConnectWithoutSeasonInput = {
    where: TournamentWhereUniqueInput
    create: XOR<TournamentCreateWithoutSeasonInput, TournamentUncheckedCreateWithoutSeasonInput>
  }

  export type TournamentCreateManySeasonInputEnvelope = {
    data: TournamentCreateManySeasonInput | TournamentCreateManySeasonInput[]
    skipDuplicates?: boolean
  }

  export type TournamentUpsertWithWhereUniqueWithoutSeasonInput = {
    where: TournamentWhereUniqueInput
    update: XOR<TournamentUpdateWithoutSeasonInput, TournamentUncheckedUpdateWithoutSeasonInput>
    create: XOR<TournamentCreateWithoutSeasonInput, TournamentUncheckedCreateWithoutSeasonInput>
  }

  export type TournamentUpdateWithWhereUniqueWithoutSeasonInput = {
    where: TournamentWhereUniqueInput
    data: XOR<TournamentUpdateWithoutSeasonInput, TournamentUncheckedUpdateWithoutSeasonInput>
  }

  export type TournamentUpdateManyWithWhereWithoutSeasonInput = {
    where: TournamentScalarWhereInput
    data: XOR<TournamentUpdateManyMutationInput, TournamentUncheckedUpdateManyWithoutSeasonInput>
  }

  export type TeamCreateWithoutTournamentInput = {
    id?: string
    name: string
    createdAt?: Date | string
    teamNumber: number
    playerStatsId?: string | null
    players?: PlayerCreateNestedManyWithoutTeamInput
  }

  export type TeamUncheckedCreateWithoutTournamentInput = {
    id?: string
    name: string
    createdAt?: Date | string
    teamNumber: number
    playerStatsId?: string | null
    players?: PlayerUncheckedCreateNestedManyWithoutTeamInput
  }

  export type TeamCreateOrConnectWithoutTournamentInput = {
    where: TeamWhereUniqueInput
    create: XOR<TeamCreateWithoutTournamentInput, TeamUncheckedCreateWithoutTournamentInput>
  }

  export type TeamCreateManyTournamentInputEnvelope = {
    data: TeamCreateManyTournamentInput | TeamCreateManyTournamentInput[]
    skipDuplicates?: boolean
  }

  export type UserCreateWithoutTournamentInput = {
    id?: string
    email?: string | null
    clerkId: string
    isEmailLinked?: boolean
    userName: string
    usernameLastChangeAt?: Date | string
    role?: $Enums.Role
    balance?: number
    isInternal?: boolean
    isVerified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    playerId?: string | null
    player?: PlayerCreateNestedOneWithoutUserInput
    wallet?: WalletCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateWithoutTournamentInput = {
    id?: string
    email?: string | null
    clerkId: string
    isEmailLinked?: boolean
    userName: string
    usernameLastChangeAt?: Date | string
    role?: $Enums.Role
    balance?: number
    isInternal?: boolean
    isVerified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    playerId?: string | null
    player?: PlayerUncheckedCreateNestedOneWithoutUserInput
    wallet?: WalletUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserCreateOrConnectWithoutTournamentInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutTournamentInput, UserUncheckedCreateWithoutTournamentInput>
  }

  export type UserCreateManyTournamentInputEnvelope = {
    data: UserCreateManyTournamentInput | UserCreateManyTournamentInput[]
    skipDuplicates?: boolean
  }

  export type SeasonCreateWithoutTournamentInput = {
    id?: string
    name: string
    description?: string | null
    startDate: Date | string
    endDate?: Date | string
    status?: $Enums.SeasonStatus
    createdBy: string
    createdAt?: Date | string
  }

  export type SeasonUncheckedCreateWithoutTournamentInput = {
    id?: string
    name: string
    description?: string | null
    startDate: Date | string
    endDate?: Date | string
    status?: $Enums.SeasonStatus
    createdBy: string
    createdAt?: Date | string
  }

  export type SeasonCreateOrConnectWithoutTournamentInput = {
    where: SeasonWhereUniqueInput
    create: XOR<SeasonCreateWithoutTournamentInput, SeasonUncheckedCreateWithoutTournamentInput>
  }

  export type TournamentWinnerCreateWithoutTournamentInput = {
    id?: string
    position: number
    createdAt?: Date | string
    player: PlayerCreateNestedOneWithoutTournamentWinnerInput
  }

  export type TournamentWinnerUncheckedCreateWithoutTournamentInput = {
    id?: string
    playerId: string
    position: number
    createdAt?: Date | string
  }

  export type TournamentWinnerCreateOrConnectWithoutTournamentInput = {
    where: TournamentWinnerWhereUniqueInput
    create: XOR<TournamentWinnerCreateWithoutTournamentInput, TournamentWinnerUncheckedCreateWithoutTournamentInput>
  }

  export type TournamentWinnerCreateManyTournamentInputEnvelope = {
    data: TournamentWinnerCreateManyTournamentInput | TournamentWinnerCreateManyTournamentInput[]
    skipDuplicates?: boolean
  }

  export type PollVoteCreateWithoutTournamentInput = {
    id?: string
    vote: $Enums.Vote
    inOption: string
    outOption: string
    soloOption: string
    startDate: Date | string
    endDate: Date | string
    createdAt?: Date | string
    player: PlayerCreateNestedOneWithoutPollVoteInput
  }

  export type PollVoteUncheckedCreateWithoutTournamentInput = {
    id?: string
    vote: $Enums.Vote
    inOption: string
    outOption: string
    soloOption: string
    startDate: Date | string
    endDate: Date | string
    playerId: string
    createdAt?: Date | string
  }

  export type PollVoteCreateOrConnectWithoutTournamentInput = {
    where: PollVoteWhereUniqueInput
    create: XOR<PollVoteCreateWithoutTournamentInput, PollVoteUncheckedCreateWithoutTournamentInput>
  }

  export type PollVoteCreateManyTournamentInputEnvelope = {
    data: PollVoteCreateManyTournamentInput | PollVoteCreateManyTournamentInput[]
    skipDuplicates?: boolean
  }

  export type MatchCreateWithoutTournamentInput = {
    id?: string
    matchName: string
    createdAt?: Date | string
  }

  export type MatchUncheckedCreateWithoutTournamentInput = {
    id?: string
    matchName: string
    createdAt?: Date | string
  }

  export type MatchCreateOrConnectWithoutTournamentInput = {
    where: MatchWhereUniqueInput
    create: XOR<MatchCreateWithoutTournamentInput, MatchUncheckedCreateWithoutTournamentInput>
  }

  export type MatchCreateManyTournamentInputEnvelope = {
    data: MatchCreateManyTournamentInput | MatchCreateManyTournamentInput[]
    skipDuplicates?: boolean
  }

  export type GalleryCreateWithoutTournamentInput = {
    id?: string
    imageId: string
    name: string
    path: string
    fullPath: string
    publicUrl: string
    isCharacterImg?: boolean
    playerId?: string | null
    player?: PlayerCreateNestedOneWithoutCharacterImageInput
  }

  export type GalleryUncheckedCreateWithoutTournamentInput = {
    id?: string
    imageId: string
    name: string
    path: string
    fullPath: string
    publicUrl: string
    isCharacterImg?: boolean
    playerId?: string | null
    player?: PlayerUncheckedCreateNestedOneWithoutCharacterImageInput
  }

  export type GalleryCreateOrConnectWithoutTournamentInput = {
    where: GalleryWhereUniqueInput
    create: XOR<GalleryCreateWithoutTournamentInput, GalleryUncheckedCreateWithoutTournamentInput>
  }

  export type TeamUpsertWithWhereUniqueWithoutTournamentInput = {
    where: TeamWhereUniqueInput
    update: XOR<TeamUpdateWithoutTournamentInput, TeamUncheckedUpdateWithoutTournamentInput>
    create: XOR<TeamCreateWithoutTournamentInput, TeamUncheckedCreateWithoutTournamentInput>
  }

  export type TeamUpdateWithWhereUniqueWithoutTournamentInput = {
    where: TeamWhereUniqueInput
    data: XOR<TeamUpdateWithoutTournamentInput, TeamUncheckedUpdateWithoutTournamentInput>
  }

  export type TeamUpdateManyWithWhereWithoutTournamentInput = {
    where: TeamScalarWhereInput
    data: XOR<TeamUpdateManyMutationInput, TeamUncheckedUpdateManyWithoutTournamentInput>
  }

  export type TeamScalarWhereInput = {
    AND?: TeamScalarWhereInput | TeamScalarWhereInput[]
    OR?: TeamScalarWhereInput[]
    NOT?: TeamScalarWhereInput | TeamScalarWhereInput[]
    id?: StringFilter<"Team"> | string
    name?: StringFilter<"Team"> | string
    createdAt?: DateTimeFilter<"Team"> | Date | string
    teamNumber?: IntFilter<"Team"> | number
    playerStatsId?: StringNullableFilter<"Team"> | string | null
    tournamentId?: StringNullableFilter<"Team"> | string | null
  }

  export type UserUpsertWithWhereUniqueWithoutTournamentInput = {
    where: UserWhereUniqueInput
    update: XOR<UserUpdateWithoutTournamentInput, UserUncheckedUpdateWithoutTournamentInput>
    create: XOR<UserCreateWithoutTournamentInput, UserUncheckedCreateWithoutTournamentInput>
  }

  export type UserUpdateWithWhereUniqueWithoutTournamentInput = {
    where: UserWhereUniqueInput
    data: XOR<UserUpdateWithoutTournamentInput, UserUncheckedUpdateWithoutTournamentInput>
  }

  export type UserUpdateManyWithWhereWithoutTournamentInput = {
    where: UserScalarWhereInput
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyWithoutTournamentInput>
  }

  export type UserScalarWhereInput = {
    AND?: UserScalarWhereInput | UserScalarWhereInput[]
    OR?: UserScalarWhereInput[]
    NOT?: UserScalarWhereInput | UserScalarWhereInput[]
    id?: StringFilter<"User"> | string
    email?: StringNullableFilter<"User"> | string | null
    clerkId?: StringFilter<"User"> | string
    isEmailLinked?: BoolFilter<"User"> | boolean
    userName?: StringFilter<"User"> | string
    usernameLastChangeAt?: DateTimeFilter<"User"> | Date | string
    role?: EnumRoleFilter<"User"> | $Enums.Role
    balance?: IntFilter<"User"> | number
    isInternal?: BoolFilter<"User"> | boolean
    isVerified?: BoolFilter<"User"> | boolean
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    playerId?: StringNullableFilter<"User"> | string | null
    tournamentId?: StringNullableFilter<"User"> | string | null
  }

  export type SeasonUpsertWithoutTournamentInput = {
    update: XOR<SeasonUpdateWithoutTournamentInput, SeasonUncheckedUpdateWithoutTournamentInput>
    create: XOR<SeasonCreateWithoutTournamentInput, SeasonUncheckedCreateWithoutTournamentInput>
    where?: SeasonWhereInput
  }

  export type SeasonUpdateToOneWithWhereWithoutTournamentInput = {
    where?: SeasonWhereInput
    data: XOR<SeasonUpdateWithoutTournamentInput, SeasonUncheckedUpdateWithoutTournamentInput>
  }

  export type SeasonUpdateWithoutTournamentInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: EnumSeasonStatusFieldUpdateOperationsInput | $Enums.SeasonStatus
    createdBy?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SeasonUncheckedUpdateWithoutTournamentInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: EnumSeasonStatusFieldUpdateOperationsInput | $Enums.SeasonStatus
    createdBy?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TournamentWinnerUpsertWithWhereUniqueWithoutTournamentInput = {
    where: TournamentWinnerWhereUniqueInput
    update: XOR<TournamentWinnerUpdateWithoutTournamentInput, TournamentWinnerUncheckedUpdateWithoutTournamentInput>
    create: XOR<TournamentWinnerCreateWithoutTournamentInput, TournamentWinnerUncheckedCreateWithoutTournamentInput>
  }

  export type TournamentWinnerUpdateWithWhereUniqueWithoutTournamentInput = {
    where: TournamentWinnerWhereUniqueInput
    data: XOR<TournamentWinnerUpdateWithoutTournamentInput, TournamentWinnerUncheckedUpdateWithoutTournamentInput>
  }

  export type TournamentWinnerUpdateManyWithWhereWithoutTournamentInput = {
    where: TournamentWinnerScalarWhereInput
    data: XOR<TournamentWinnerUpdateManyMutationInput, TournamentWinnerUncheckedUpdateManyWithoutTournamentInput>
  }

  export type PollVoteUpsertWithWhereUniqueWithoutTournamentInput = {
    where: PollVoteWhereUniqueInput
    update: XOR<PollVoteUpdateWithoutTournamentInput, PollVoteUncheckedUpdateWithoutTournamentInput>
    create: XOR<PollVoteCreateWithoutTournamentInput, PollVoteUncheckedCreateWithoutTournamentInput>
  }

  export type PollVoteUpdateWithWhereUniqueWithoutTournamentInput = {
    where: PollVoteWhereUniqueInput
    data: XOR<PollVoteUpdateWithoutTournamentInput, PollVoteUncheckedUpdateWithoutTournamentInput>
  }

  export type PollVoteUpdateManyWithWhereWithoutTournamentInput = {
    where: PollVoteScalarWhereInput
    data: XOR<PollVoteUpdateManyMutationInput, PollVoteUncheckedUpdateManyWithoutTournamentInput>
  }

  export type PollVoteScalarWhereInput = {
    AND?: PollVoteScalarWhereInput | PollVoteScalarWhereInput[]
    OR?: PollVoteScalarWhereInput[]
    NOT?: PollVoteScalarWhereInput | PollVoteScalarWhereInput[]
    id?: StringFilter<"PollVote"> | string
    vote?: EnumVoteFilter<"PollVote"> | $Enums.Vote
    inOption?: StringFilter<"PollVote"> | string
    outOption?: StringFilter<"PollVote"> | string
    soloOption?: StringFilter<"PollVote"> | string
    startDate?: DateTimeFilter<"PollVote"> | Date | string
    endDate?: DateTimeFilter<"PollVote"> | Date | string
    playerId?: StringFilter<"PollVote"> | string
    tournamentId?: StringFilter<"PollVote"> | string
    createdAt?: DateTimeFilter<"PollVote"> | Date | string
  }

  export type MatchUpsertWithWhereUniqueWithoutTournamentInput = {
    where: MatchWhereUniqueInput
    update: XOR<MatchUpdateWithoutTournamentInput, MatchUncheckedUpdateWithoutTournamentInput>
    create: XOR<MatchCreateWithoutTournamentInput, MatchUncheckedCreateWithoutTournamentInput>
  }

  export type MatchUpdateWithWhereUniqueWithoutTournamentInput = {
    where: MatchWhereUniqueInput
    data: XOR<MatchUpdateWithoutTournamentInput, MatchUncheckedUpdateWithoutTournamentInput>
  }

  export type MatchUpdateManyWithWhereWithoutTournamentInput = {
    where: MatchScalarWhereInput
    data: XOR<MatchUpdateManyMutationInput, MatchUncheckedUpdateManyWithoutTournamentInput>
  }

  export type MatchScalarWhereInput = {
    AND?: MatchScalarWhereInput | MatchScalarWhereInput[]
    OR?: MatchScalarWhereInput[]
    NOT?: MatchScalarWhereInput | MatchScalarWhereInput[]
    id?: StringFilter<"Match"> | string
    matchName?: StringFilter<"Match"> | string
    tournamentId?: StringFilter<"Match"> | string
    createdAt?: DateTimeFilter<"Match"> | Date | string
  }

  export type GalleryUpsertWithoutTournamentInput = {
    update: XOR<GalleryUpdateWithoutTournamentInput, GalleryUncheckedUpdateWithoutTournamentInput>
    create: XOR<GalleryCreateWithoutTournamentInput, GalleryUncheckedCreateWithoutTournamentInput>
    where?: GalleryWhereInput
  }

  export type GalleryUpdateToOneWithWhereWithoutTournamentInput = {
    where?: GalleryWhereInput
    data: XOR<GalleryUpdateWithoutTournamentInput, GalleryUncheckedUpdateWithoutTournamentInput>
  }

  export type GalleryUpdateWithoutTournamentInput = {
    id?: StringFieldUpdateOperationsInput | string
    imageId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    path?: StringFieldUpdateOperationsInput | string
    fullPath?: StringFieldUpdateOperationsInput | string
    publicUrl?: StringFieldUpdateOperationsInput | string
    isCharacterImg?: BoolFieldUpdateOperationsInput | boolean
    playerId?: NullableStringFieldUpdateOperationsInput | string | null
    player?: PlayerUpdateOneWithoutCharacterImageNestedInput
  }

  export type GalleryUncheckedUpdateWithoutTournamentInput = {
    id?: StringFieldUpdateOperationsInput | string
    imageId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    path?: StringFieldUpdateOperationsInput | string
    fullPath?: StringFieldUpdateOperationsInput | string
    publicUrl?: StringFieldUpdateOperationsInput | string
    isCharacterImg?: BoolFieldUpdateOperationsInput | boolean
    playerId?: NullableStringFieldUpdateOperationsInput | string | null
    player?: PlayerUncheckedUpdateOneWithoutCharacterImageNestedInput
  }

  export type PlayerCreateWithoutPollVoteInput = {
    id?: string
    isBanned?: boolean
    category?: $Enums.PlayerCategory
    gameScore?: GameScoreCreateNestedManyWithoutPlayerInput
    user: UserCreateNestedOneWithoutPlayerInput
    tournamentWinner?: TournamentWinnerCreateNestedManyWithoutPlayerInput
    Wallet?: WalletCreateNestedOneWithoutPlayerInput
    playerStats?: PlayerStatsCreateNestedOneWithoutPlayerInput
    team?: TeamCreateNestedOneWithoutPlayersInput
    characterImage?: GalleryCreateNestedOneWithoutPlayerInput
  }

  export type PlayerUncheckedCreateWithoutPollVoteInput = {
    id?: string
    isBanned?: boolean
    category?: $Enums.PlayerCategory
    userId: string
    teamId?: string | null
    characterImageId?: string | null
    gameScore?: GameScoreUncheckedCreateNestedManyWithoutPlayerInput
    tournamentWinner?: TournamentWinnerUncheckedCreateNestedManyWithoutPlayerInput
    Wallet?: WalletUncheckedCreateNestedOneWithoutPlayerInput
    playerStats?: PlayerStatsUncheckedCreateNestedOneWithoutPlayerInput
  }

  export type PlayerCreateOrConnectWithoutPollVoteInput = {
    where: PlayerWhereUniqueInput
    create: XOR<PlayerCreateWithoutPollVoteInput, PlayerUncheckedCreateWithoutPollVoteInput>
  }

  export type TournamentCreateWithoutPollVoteInput = {
    id?: string
    name: string
    startDate: Date | string
    fee?: number | null
    createdBy?: string | null
    createdAt?: Date | string
    team?: TeamCreateNestedManyWithoutTournamentInput
    user?: UserCreateNestedManyWithoutTournamentInput
    season?: SeasonCreateNestedOneWithoutTournamentInput
    tournamentWinner?: TournamentWinnerCreateNestedManyWithoutTournamentInput
    match?: MatchCreateNestedManyWithoutTournamentInput
    gallery?: GalleryCreateNestedOneWithoutTournamentInput
  }

  export type TournamentUncheckedCreateWithoutPollVoteInput = {
    id?: string
    name: string
    startDate: Date | string
    fee?: number | null
    seasonId?: string | null
    createdBy?: string | null
    createdAt?: Date | string
    galleryId?: string | null
    team?: TeamUncheckedCreateNestedManyWithoutTournamentInput
    user?: UserUncheckedCreateNestedManyWithoutTournamentInput
    tournamentWinner?: TournamentWinnerUncheckedCreateNestedManyWithoutTournamentInput
    match?: MatchUncheckedCreateNestedManyWithoutTournamentInput
  }

  export type TournamentCreateOrConnectWithoutPollVoteInput = {
    where: TournamentWhereUniqueInput
    create: XOR<TournamentCreateWithoutPollVoteInput, TournamentUncheckedCreateWithoutPollVoteInput>
  }

  export type PlayerUpsertWithoutPollVoteInput = {
    update: XOR<PlayerUpdateWithoutPollVoteInput, PlayerUncheckedUpdateWithoutPollVoteInput>
    create: XOR<PlayerCreateWithoutPollVoteInput, PlayerUncheckedCreateWithoutPollVoteInput>
    where?: PlayerWhereInput
  }

  export type PlayerUpdateToOneWithWhereWithoutPollVoteInput = {
    where?: PlayerWhereInput
    data: XOR<PlayerUpdateWithoutPollVoteInput, PlayerUncheckedUpdateWithoutPollVoteInput>
  }

  export type PlayerUpdateWithoutPollVoteInput = {
    id?: StringFieldUpdateOperationsInput | string
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    category?: EnumPlayerCategoryFieldUpdateOperationsInput | $Enums.PlayerCategory
    gameScore?: GameScoreUpdateManyWithoutPlayerNestedInput
    user?: UserUpdateOneRequiredWithoutPlayerNestedInput
    tournamentWinner?: TournamentWinnerUpdateManyWithoutPlayerNestedInput
    Wallet?: WalletUpdateOneWithoutPlayerNestedInput
    playerStats?: PlayerStatsUpdateOneWithoutPlayerNestedInput
    team?: TeamUpdateOneWithoutPlayersNestedInput
    characterImage?: GalleryUpdateOneWithoutPlayerNestedInput
  }

  export type PlayerUncheckedUpdateWithoutPollVoteInput = {
    id?: StringFieldUpdateOperationsInput | string
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    category?: EnumPlayerCategoryFieldUpdateOperationsInput | $Enums.PlayerCategory
    userId?: StringFieldUpdateOperationsInput | string
    teamId?: NullableStringFieldUpdateOperationsInput | string | null
    characterImageId?: NullableStringFieldUpdateOperationsInput | string | null
    gameScore?: GameScoreUncheckedUpdateManyWithoutPlayerNestedInput
    tournamentWinner?: TournamentWinnerUncheckedUpdateManyWithoutPlayerNestedInput
    Wallet?: WalletUncheckedUpdateOneWithoutPlayerNestedInput
    playerStats?: PlayerStatsUncheckedUpdateOneWithoutPlayerNestedInput
  }

  export type TournamentUpsertWithoutPollVoteInput = {
    update: XOR<TournamentUpdateWithoutPollVoteInput, TournamentUncheckedUpdateWithoutPollVoteInput>
    create: XOR<TournamentCreateWithoutPollVoteInput, TournamentUncheckedCreateWithoutPollVoteInput>
    where?: TournamentWhereInput
  }

  export type TournamentUpdateToOneWithWhereWithoutPollVoteInput = {
    where?: TournamentWhereInput
    data: XOR<TournamentUpdateWithoutPollVoteInput, TournamentUncheckedUpdateWithoutPollVoteInput>
  }

  export type TournamentUpdateWithoutPollVoteInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    fee?: NullableIntFieldUpdateOperationsInput | number | null
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    team?: TeamUpdateManyWithoutTournamentNestedInput
    user?: UserUpdateManyWithoutTournamentNestedInput
    season?: SeasonUpdateOneWithoutTournamentNestedInput
    tournamentWinner?: TournamentWinnerUpdateManyWithoutTournamentNestedInput
    match?: MatchUpdateManyWithoutTournamentNestedInput
    gallery?: GalleryUpdateOneWithoutTournamentNestedInput
  }

  export type TournamentUncheckedUpdateWithoutPollVoteInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    fee?: NullableIntFieldUpdateOperationsInput | number | null
    seasonId?: NullableStringFieldUpdateOperationsInput | string | null
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    galleryId?: NullableStringFieldUpdateOperationsInput | string | null
    team?: TeamUncheckedUpdateManyWithoutTournamentNestedInput
    user?: UserUncheckedUpdateManyWithoutTournamentNestedInput
    tournamentWinner?: TournamentWinnerUncheckedUpdateManyWithoutTournamentNestedInput
    match?: MatchUncheckedUpdateManyWithoutTournamentNestedInput
  }

  export type PlayerCreateWithoutTournamentWinnerInput = {
    id?: string
    isBanned?: boolean
    category?: $Enums.PlayerCategory
    gameScore?: GameScoreCreateNestedManyWithoutPlayerInput
    pollVote?: PollVoteCreateNestedOneWithoutPlayerInput
    user: UserCreateNestedOneWithoutPlayerInput
    Wallet?: WalletCreateNestedOneWithoutPlayerInput
    playerStats?: PlayerStatsCreateNestedOneWithoutPlayerInput
    team?: TeamCreateNestedOneWithoutPlayersInput
    characterImage?: GalleryCreateNestedOneWithoutPlayerInput
  }

  export type PlayerUncheckedCreateWithoutTournamentWinnerInput = {
    id?: string
    isBanned?: boolean
    category?: $Enums.PlayerCategory
    userId: string
    teamId?: string | null
    characterImageId?: string | null
    gameScore?: GameScoreUncheckedCreateNestedManyWithoutPlayerInput
    pollVote?: PollVoteUncheckedCreateNestedOneWithoutPlayerInput
    Wallet?: WalletUncheckedCreateNestedOneWithoutPlayerInput
    playerStats?: PlayerStatsUncheckedCreateNestedOneWithoutPlayerInput
  }

  export type PlayerCreateOrConnectWithoutTournamentWinnerInput = {
    where: PlayerWhereUniqueInput
    create: XOR<PlayerCreateWithoutTournamentWinnerInput, PlayerUncheckedCreateWithoutTournamentWinnerInput>
  }

  export type TournamentCreateWithoutTournamentWinnerInput = {
    id?: string
    name: string
    startDate: Date | string
    fee?: number | null
    createdBy?: string | null
    createdAt?: Date | string
    team?: TeamCreateNestedManyWithoutTournamentInput
    user?: UserCreateNestedManyWithoutTournamentInput
    season?: SeasonCreateNestedOneWithoutTournamentInput
    pollVote?: PollVoteCreateNestedManyWithoutTournamentInput
    match?: MatchCreateNestedManyWithoutTournamentInput
    gallery?: GalleryCreateNestedOneWithoutTournamentInput
  }

  export type TournamentUncheckedCreateWithoutTournamentWinnerInput = {
    id?: string
    name: string
    startDate: Date | string
    fee?: number | null
    seasonId?: string | null
    createdBy?: string | null
    createdAt?: Date | string
    galleryId?: string | null
    team?: TeamUncheckedCreateNestedManyWithoutTournamentInput
    user?: UserUncheckedCreateNestedManyWithoutTournamentInput
    pollVote?: PollVoteUncheckedCreateNestedManyWithoutTournamentInput
    match?: MatchUncheckedCreateNestedManyWithoutTournamentInput
  }

  export type TournamentCreateOrConnectWithoutTournamentWinnerInput = {
    where: TournamentWhereUniqueInput
    create: XOR<TournamentCreateWithoutTournamentWinnerInput, TournamentUncheckedCreateWithoutTournamentWinnerInput>
  }

  export type PlayerUpsertWithoutTournamentWinnerInput = {
    update: XOR<PlayerUpdateWithoutTournamentWinnerInput, PlayerUncheckedUpdateWithoutTournamentWinnerInput>
    create: XOR<PlayerCreateWithoutTournamentWinnerInput, PlayerUncheckedCreateWithoutTournamentWinnerInput>
    where?: PlayerWhereInput
  }

  export type PlayerUpdateToOneWithWhereWithoutTournamentWinnerInput = {
    where?: PlayerWhereInput
    data: XOR<PlayerUpdateWithoutTournamentWinnerInput, PlayerUncheckedUpdateWithoutTournamentWinnerInput>
  }

  export type PlayerUpdateWithoutTournamentWinnerInput = {
    id?: StringFieldUpdateOperationsInput | string
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    category?: EnumPlayerCategoryFieldUpdateOperationsInput | $Enums.PlayerCategory
    gameScore?: GameScoreUpdateManyWithoutPlayerNestedInput
    pollVote?: PollVoteUpdateOneWithoutPlayerNestedInput
    user?: UserUpdateOneRequiredWithoutPlayerNestedInput
    Wallet?: WalletUpdateOneWithoutPlayerNestedInput
    playerStats?: PlayerStatsUpdateOneWithoutPlayerNestedInput
    team?: TeamUpdateOneWithoutPlayersNestedInput
    characterImage?: GalleryUpdateOneWithoutPlayerNestedInput
  }

  export type PlayerUncheckedUpdateWithoutTournamentWinnerInput = {
    id?: StringFieldUpdateOperationsInput | string
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    category?: EnumPlayerCategoryFieldUpdateOperationsInput | $Enums.PlayerCategory
    userId?: StringFieldUpdateOperationsInput | string
    teamId?: NullableStringFieldUpdateOperationsInput | string | null
    characterImageId?: NullableStringFieldUpdateOperationsInput | string | null
    gameScore?: GameScoreUncheckedUpdateManyWithoutPlayerNestedInput
    pollVote?: PollVoteUncheckedUpdateOneWithoutPlayerNestedInput
    Wallet?: WalletUncheckedUpdateOneWithoutPlayerNestedInput
    playerStats?: PlayerStatsUncheckedUpdateOneWithoutPlayerNestedInput
  }

  export type TournamentUpsertWithoutTournamentWinnerInput = {
    update: XOR<TournamentUpdateWithoutTournamentWinnerInput, TournamentUncheckedUpdateWithoutTournamentWinnerInput>
    create: XOR<TournamentCreateWithoutTournamentWinnerInput, TournamentUncheckedCreateWithoutTournamentWinnerInput>
    where?: TournamentWhereInput
  }

  export type TournamentUpdateToOneWithWhereWithoutTournamentWinnerInput = {
    where?: TournamentWhereInput
    data: XOR<TournamentUpdateWithoutTournamentWinnerInput, TournamentUncheckedUpdateWithoutTournamentWinnerInput>
  }

  export type TournamentUpdateWithoutTournamentWinnerInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    fee?: NullableIntFieldUpdateOperationsInput | number | null
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    team?: TeamUpdateManyWithoutTournamentNestedInput
    user?: UserUpdateManyWithoutTournamentNestedInput
    season?: SeasonUpdateOneWithoutTournamentNestedInput
    pollVote?: PollVoteUpdateManyWithoutTournamentNestedInput
    match?: MatchUpdateManyWithoutTournamentNestedInput
    gallery?: GalleryUpdateOneWithoutTournamentNestedInput
  }

  export type TournamentUncheckedUpdateWithoutTournamentWinnerInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    fee?: NullableIntFieldUpdateOperationsInput | number | null
    seasonId?: NullableStringFieldUpdateOperationsInput | string | null
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    galleryId?: NullableStringFieldUpdateOperationsInput | string | null
    team?: TeamUncheckedUpdateManyWithoutTournamentNestedInput
    user?: UserUncheckedUpdateManyWithoutTournamentNestedInput
    pollVote?: PollVoteUncheckedUpdateManyWithoutTournamentNestedInput
    match?: MatchUncheckedUpdateManyWithoutTournamentNestedInput
  }

  export type TournamentCreateWithoutMatchInput = {
    id?: string
    name: string
    startDate: Date | string
    fee?: number | null
    createdBy?: string | null
    createdAt?: Date | string
    team?: TeamCreateNestedManyWithoutTournamentInput
    user?: UserCreateNestedManyWithoutTournamentInput
    season?: SeasonCreateNestedOneWithoutTournamentInput
    tournamentWinner?: TournamentWinnerCreateNestedManyWithoutTournamentInput
    pollVote?: PollVoteCreateNestedManyWithoutTournamentInput
    gallery?: GalleryCreateNestedOneWithoutTournamentInput
  }

  export type TournamentUncheckedCreateWithoutMatchInput = {
    id?: string
    name: string
    startDate: Date | string
    fee?: number | null
    seasonId?: string | null
    createdBy?: string | null
    createdAt?: Date | string
    galleryId?: string | null
    team?: TeamUncheckedCreateNestedManyWithoutTournamentInput
    user?: UserUncheckedCreateNestedManyWithoutTournamentInput
    tournamentWinner?: TournamentWinnerUncheckedCreateNestedManyWithoutTournamentInput
    pollVote?: PollVoteUncheckedCreateNestedManyWithoutTournamentInput
  }

  export type TournamentCreateOrConnectWithoutMatchInput = {
    where: TournamentWhereUniqueInput
    create: XOR<TournamentCreateWithoutMatchInput, TournamentUncheckedCreateWithoutMatchInput>
  }

  export type TournamentUpsertWithoutMatchInput = {
    update: XOR<TournamentUpdateWithoutMatchInput, TournamentUncheckedUpdateWithoutMatchInput>
    create: XOR<TournamentCreateWithoutMatchInput, TournamentUncheckedCreateWithoutMatchInput>
    where?: TournamentWhereInput
  }

  export type TournamentUpdateToOneWithWhereWithoutMatchInput = {
    where?: TournamentWhereInput
    data: XOR<TournamentUpdateWithoutMatchInput, TournamentUncheckedUpdateWithoutMatchInput>
  }

  export type TournamentUpdateWithoutMatchInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    fee?: NullableIntFieldUpdateOperationsInput | number | null
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    team?: TeamUpdateManyWithoutTournamentNestedInput
    user?: UserUpdateManyWithoutTournamentNestedInput
    season?: SeasonUpdateOneWithoutTournamentNestedInput
    tournamentWinner?: TournamentWinnerUpdateManyWithoutTournamentNestedInput
    pollVote?: PollVoteUpdateManyWithoutTournamentNestedInput
    gallery?: GalleryUpdateOneWithoutTournamentNestedInput
  }

  export type TournamentUncheckedUpdateWithoutMatchInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    fee?: NullableIntFieldUpdateOperationsInput | number | null
    seasonId?: NullableStringFieldUpdateOperationsInput | string | null
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    galleryId?: NullableStringFieldUpdateOperationsInput | string | null
    team?: TeamUncheckedUpdateManyWithoutTournamentNestedInput
    user?: UserUncheckedUpdateManyWithoutTournamentNestedInput
    tournamentWinner?: TournamentWinnerUncheckedUpdateManyWithoutTournamentNestedInput
    pollVote?: PollVoteUncheckedUpdateManyWithoutTournamentNestedInput
  }

  export type PlayerCreateWithoutWalletInput = {
    id?: string
    isBanned?: boolean
    category?: $Enums.PlayerCategory
    gameScore?: GameScoreCreateNestedManyWithoutPlayerInput
    pollVote?: PollVoteCreateNestedOneWithoutPlayerInput
    user: UserCreateNestedOneWithoutPlayerInput
    tournamentWinner?: TournamentWinnerCreateNestedManyWithoutPlayerInput
    playerStats?: PlayerStatsCreateNestedOneWithoutPlayerInput
    team?: TeamCreateNestedOneWithoutPlayersInput
    characterImage?: GalleryCreateNestedOneWithoutPlayerInput
  }

  export type PlayerUncheckedCreateWithoutWalletInput = {
    id?: string
    isBanned?: boolean
    category?: $Enums.PlayerCategory
    userId: string
    teamId?: string | null
    characterImageId?: string | null
    gameScore?: GameScoreUncheckedCreateNestedManyWithoutPlayerInput
    pollVote?: PollVoteUncheckedCreateNestedOneWithoutPlayerInput
    tournamentWinner?: TournamentWinnerUncheckedCreateNestedManyWithoutPlayerInput
    playerStats?: PlayerStatsUncheckedCreateNestedOneWithoutPlayerInput
  }

  export type PlayerCreateOrConnectWithoutWalletInput = {
    where: PlayerWhereUniqueInput
    create: XOR<PlayerCreateWithoutWalletInput, PlayerUncheckedCreateWithoutWalletInput>
  }

  export type UserCreateWithoutWalletInput = {
    id?: string
    email?: string | null
    clerkId: string
    isEmailLinked?: boolean
    userName: string
    usernameLastChangeAt?: Date | string
    role?: $Enums.Role
    balance?: number
    isInternal?: boolean
    isVerified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    playerId?: string | null
    player?: PlayerCreateNestedOneWithoutUserInput
    tournament?: TournamentCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateWithoutWalletInput = {
    id?: string
    email?: string | null
    clerkId: string
    isEmailLinked?: boolean
    userName: string
    usernameLastChangeAt?: Date | string
    role?: $Enums.Role
    balance?: number
    isInternal?: boolean
    isVerified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    playerId?: string | null
    tournamentId?: string | null
    player?: PlayerUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserCreateOrConnectWithoutWalletInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutWalletInput, UserUncheckedCreateWithoutWalletInput>
  }

  export type PlayerUpsertWithoutWalletInput = {
    update: XOR<PlayerUpdateWithoutWalletInput, PlayerUncheckedUpdateWithoutWalletInput>
    create: XOR<PlayerCreateWithoutWalletInput, PlayerUncheckedCreateWithoutWalletInput>
    where?: PlayerWhereInput
  }

  export type PlayerUpdateToOneWithWhereWithoutWalletInput = {
    where?: PlayerWhereInput
    data: XOR<PlayerUpdateWithoutWalletInput, PlayerUncheckedUpdateWithoutWalletInput>
  }

  export type PlayerUpdateWithoutWalletInput = {
    id?: StringFieldUpdateOperationsInput | string
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    category?: EnumPlayerCategoryFieldUpdateOperationsInput | $Enums.PlayerCategory
    gameScore?: GameScoreUpdateManyWithoutPlayerNestedInput
    pollVote?: PollVoteUpdateOneWithoutPlayerNestedInput
    user?: UserUpdateOneRequiredWithoutPlayerNestedInput
    tournamentWinner?: TournamentWinnerUpdateManyWithoutPlayerNestedInput
    playerStats?: PlayerStatsUpdateOneWithoutPlayerNestedInput
    team?: TeamUpdateOneWithoutPlayersNestedInput
    characterImage?: GalleryUpdateOneWithoutPlayerNestedInput
  }

  export type PlayerUncheckedUpdateWithoutWalletInput = {
    id?: StringFieldUpdateOperationsInput | string
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    category?: EnumPlayerCategoryFieldUpdateOperationsInput | $Enums.PlayerCategory
    userId?: StringFieldUpdateOperationsInput | string
    teamId?: NullableStringFieldUpdateOperationsInput | string | null
    characterImageId?: NullableStringFieldUpdateOperationsInput | string | null
    gameScore?: GameScoreUncheckedUpdateManyWithoutPlayerNestedInput
    pollVote?: PollVoteUncheckedUpdateOneWithoutPlayerNestedInput
    tournamentWinner?: TournamentWinnerUncheckedUpdateManyWithoutPlayerNestedInput
    playerStats?: PlayerStatsUncheckedUpdateOneWithoutPlayerNestedInput
  }

  export type UserUpsertWithoutWalletInput = {
    update: XOR<UserUpdateWithoutWalletInput, UserUncheckedUpdateWithoutWalletInput>
    create: XOR<UserCreateWithoutWalletInput, UserUncheckedCreateWithoutWalletInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutWalletInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutWalletInput, UserUncheckedUpdateWithoutWalletInput>
  }

  export type UserUpdateWithoutWalletInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    clerkId?: StringFieldUpdateOperationsInput | string
    isEmailLinked?: BoolFieldUpdateOperationsInput | boolean
    userName?: StringFieldUpdateOperationsInput | string
    usernameLastChangeAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    balance?: IntFieldUpdateOperationsInput | number
    isInternal?: BoolFieldUpdateOperationsInput | boolean
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    playerId?: NullableStringFieldUpdateOperationsInput | string | null
    player?: PlayerUpdateOneWithoutUserNestedInput
    tournament?: TournamentUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutWalletInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    clerkId?: StringFieldUpdateOperationsInput | string
    isEmailLinked?: BoolFieldUpdateOperationsInput | boolean
    userName?: StringFieldUpdateOperationsInput | string
    usernameLastChangeAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    balance?: IntFieldUpdateOperationsInput | number
    isInternal?: BoolFieldUpdateOperationsInput | boolean
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    playerId?: NullableStringFieldUpdateOperationsInput | string | null
    tournamentId?: NullableStringFieldUpdateOperationsInput | string | null
    player?: PlayerUncheckedUpdateOneWithoutUserNestedInput
  }

  export type PlayerCreateWithoutPlayerStatsInput = {
    id?: string
    isBanned?: boolean
    category?: $Enums.PlayerCategory
    gameScore?: GameScoreCreateNestedManyWithoutPlayerInput
    pollVote?: PollVoteCreateNestedOneWithoutPlayerInput
    user: UserCreateNestedOneWithoutPlayerInput
    tournamentWinner?: TournamentWinnerCreateNestedManyWithoutPlayerInput
    Wallet?: WalletCreateNestedOneWithoutPlayerInput
    team?: TeamCreateNestedOneWithoutPlayersInput
    characterImage?: GalleryCreateNestedOneWithoutPlayerInput
  }

  export type PlayerUncheckedCreateWithoutPlayerStatsInput = {
    id?: string
    isBanned?: boolean
    category?: $Enums.PlayerCategory
    userId: string
    teamId?: string | null
    characterImageId?: string | null
    gameScore?: GameScoreUncheckedCreateNestedManyWithoutPlayerInput
    pollVote?: PollVoteUncheckedCreateNestedOneWithoutPlayerInput
    tournamentWinner?: TournamentWinnerUncheckedCreateNestedManyWithoutPlayerInput
    Wallet?: WalletUncheckedCreateNestedOneWithoutPlayerInput
  }

  export type PlayerCreateOrConnectWithoutPlayerStatsInput = {
    where: PlayerWhereUniqueInput
    create: XOR<PlayerCreateWithoutPlayerStatsInput, PlayerUncheckedCreateWithoutPlayerStatsInput>
  }

  export type PlayerUpsertWithoutPlayerStatsInput = {
    update: XOR<PlayerUpdateWithoutPlayerStatsInput, PlayerUncheckedUpdateWithoutPlayerStatsInput>
    create: XOR<PlayerCreateWithoutPlayerStatsInput, PlayerUncheckedCreateWithoutPlayerStatsInput>
    where?: PlayerWhereInput
  }

  export type PlayerUpdateToOneWithWhereWithoutPlayerStatsInput = {
    where?: PlayerWhereInput
    data: XOR<PlayerUpdateWithoutPlayerStatsInput, PlayerUncheckedUpdateWithoutPlayerStatsInput>
  }

  export type PlayerUpdateWithoutPlayerStatsInput = {
    id?: StringFieldUpdateOperationsInput | string
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    category?: EnumPlayerCategoryFieldUpdateOperationsInput | $Enums.PlayerCategory
    gameScore?: GameScoreUpdateManyWithoutPlayerNestedInput
    pollVote?: PollVoteUpdateOneWithoutPlayerNestedInput
    user?: UserUpdateOneRequiredWithoutPlayerNestedInput
    tournamentWinner?: TournamentWinnerUpdateManyWithoutPlayerNestedInput
    Wallet?: WalletUpdateOneWithoutPlayerNestedInput
    team?: TeamUpdateOneWithoutPlayersNestedInput
    characterImage?: GalleryUpdateOneWithoutPlayerNestedInput
  }

  export type PlayerUncheckedUpdateWithoutPlayerStatsInput = {
    id?: StringFieldUpdateOperationsInput | string
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    category?: EnumPlayerCategoryFieldUpdateOperationsInput | $Enums.PlayerCategory
    userId?: StringFieldUpdateOperationsInput | string
    teamId?: NullableStringFieldUpdateOperationsInput | string | null
    characterImageId?: NullableStringFieldUpdateOperationsInput | string | null
    gameScore?: GameScoreUncheckedUpdateManyWithoutPlayerNestedInput
    pollVote?: PollVoteUncheckedUpdateOneWithoutPlayerNestedInput
    tournamentWinner?: TournamentWinnerUncheckedUpdateManyWithoutPlayerNestedInput
    Wallet?: WalletUncheckedUpdateOneWithoutPlayerNestedInput
  }

  export type PlayerCreateWithoutTeamInput = {
    id?: string
    isBanned?: boolean
    category?: $Enums.PlayerCategory
    gameScore?: GameScoreCreateNestedManyWithoutPlayerInput
    pollVote?: PollVoteCreateNestedOneWithoutPlayerInput
    user: UserCreateNestedOneWithoutPlayerInput
    tournamentWinner?: TournamentWinnerCreateNestedManyWithoutPlayerInput
    Wallet?: WalletCreateNestedOneWithoutPlayerInput
    playerStats?: PlayerStatsCreateNestedOneWithoutPlayerInput
    characterImage?: GalleryCreateNestedOneWithoutPlayerInput
  }

  export type PlayerUncheckedCreateWithoutTeamInput = {
    id?: string
    isBanned?: boolean
    category?: $Enums.PlayerCategory
    userId: string
    characterImageId?: string | null
    gameScore?: GameScoreUncheckedCreateNestedManyWithoutPlayerInput
    pollVote?: PollVoteUncheckedCreateNestedOneWithoutPlayerInput
    tournamentWinner?: TournamentWinnerUncheckedCreateNestedManyWithoutPlayerInput
    Wallet?: WalletUncheckedCreateNestedOneWithoutPlayerInput
    playerStats?: PlayerStatsUncheckedCreateNestedOneWithoutPlayerInput
  }

  export type PlayerCreateOrConnectWithoutTeamInput = {
    where: PlayerWhereUniqueInput
    create: XOR<PlayerCreateWithoutTeamInput, PlayerUncheckedCreateWithoutTeamInput>
  }

  export type PlayerCreateManyTeamInputEnvelope = {
    data: PlayerCreateManyTeamInput | PlayerCreateManyTeamInput[]
    skipDuplicates?: boolean
  }

  export type TournamentCreateWithoutTeamInput = {
    id?: string
    name: string
    startDate: Date | string
    fee?: number | null
    createdBy?: string | null
    createdAt?: Date | string
    user?: UserCreateNestedManyWithoutTournamentInput
    season?: SeasonCreateNestedOneWithoutTournamentInput
    tournamentWinner?: TournamentWinnerCreateNestedManyWithoutTournamentInput
    pollVote?: PollVoteCreateNestedManyWithoutTournamentInput
    match?: MatchCreateNestedManyWithoutTournamentInput
    gallery?: GalleryCreateNestedOneWithoutTournamentInput
  }

  export type TournamentUncheckedCreateWithoutTeamInput = {
    id?: string
    name: string
    startDate: Date | string
    fee?: number | null
    seasonId?: string | null
    createdBy?: string | null
    createdAt?: Date | string
    galleryId?: string | null
    user?: UserUncheckedCreateNestedManyWithoutTournamentInput
    tournamentWinner?: TournamentWinnerUncheckedCreateNestedManyWithoutTournamentInput
    pollVote?: PollVoteUncheckedCreateNestedManyWithoutTournamentInput
    match?: MatchUncheckedCreateNestedManyWithoutTournamentInput
  }

  export type TournamentCreateOrConnectWithoutTeamInput = {
    where: TournamentWhereUniqueInput
    create: XOR<TournamentCreateWithoutTeamInput, TournamentUncheckedCreateWithoutTeamInput>
  }

  export type PlayerUpsertWithWhereUniqueWithoutTeamInput = {
    where: PlayerWhereUniqueInput
    update: XOR<PlayerUpdateWithoutTeamInput, PlayerUncheckedUpdateWithoutTeamInput>
    create: XOR<PlayerCreateWithoutTeamInput, PlayerUncheckedCreateWithoutTeamInput>
  }

  export type PlayerUpdateWithWhereUniqueWithoutTeamInput = {
    where: PlayerWhereUniqueInput
    data: XOR<PlayerUpdateWithoutTeamInput, PlayerUncheckedUpdateWithoutTeamInput>
  }

  export type PlayerUpdateManyWithWhereWithoutTeamInput = {
    where: PlayerScalarWhereInput
    data: XOR<PlayerUpdateManyMutationInput, PlayerUncheckedUpdateManyWithoutTeamInput>
  }

  export type PlayerScalarWhereInput = {
    AND?: PlayerScalarWhereInput | PlayerScalarWhereInput[]
    OR?: PlayerScalarWhereInput[]
    NOT?: PlayerScalarWhereInput | PlayerScalarWhereInput[]
    id?: StringFilter<"Player"> | string
    isBanned?: BoolFilter<"Player"> | boolean
    category?: EnumPlayerCategoryFilter<"Player"> | $Enums.PlayerCategory
    userId?: StringFilter<"Player"> | string
    teamId?: StringNullableFilter<"Player"> | string | null
    characterImageId?: StringNullableFilter<"Player"> | string | null
  }

  export type TournamentUpsertWithoutTeamInput = {
    update: XOR<TournamentUpdateWithoutTeamInput, TournamentUncheckedUpdateWithoutTeamInput>
    create: XOR<TournamentCreateWithoutTeamInput, TournamentUncheckedCreateWithoutTeamInput>
    where?: TournamentWhereInput
  }

  export type TournamentUpdateToOneWithWhereWithoutTeamInput = {
    where?: TournamentWhereInput
    data: XOR<TournamentUpdateWithoutTeamInput, TournamentUncheckedUpdateWithoutTeamInput>
  }

  export type TournamentUpdateWithoutTeamInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    fee?: NullableIntFieldUpdateOperationsInput | number | null
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateManyWithoutTournamentNestedInput
    season?: SeasonUpdateOneWithoutTournamentNestedInput
    tournamentWinner?: TournamentWinnerUpdateManyWithoutTournamentNestedInput
    pollVote?: PollVoteUpdateManyWithoutTournamentNestedInput
    match?: MatchUpdateManyWithoutTournamentNestedInput
    gallery?: GalleryUpdateOneWithoutTournamentNestedInput
  }

  export type TournamentUncheckedUpdateWithoutTeamInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    fee?: NullableIntFieldUpdateOperationsInput | number | null
    seasonId?: NullableStringFieldUpdateOperationsInput | string | null
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    galleryId?: NullableStringFieldUpdateOperationsInput | string | null
    user?: UserUncheckedUpdateManyWithoutTournamentNestedInput
    tournamentWinner?: TournamentWinnerUncheckedUpdateManyWithoutTournamentNestedInput
    pollVote?: PollVoteUncheckedUpdateManyWithoutTournamentNestedInput
    match?: MatchUncheckedUpdateManyWithoutTournamentNestedInput
  }

  export type GameScoreCreateManyPlayerInput = {
    highScore: number
    lastPlayedAt: Date | string
  }

  export type TournamentWinnerCreateManyPlayerInput = {
    id?: string
    position: number
    tournamentId: string
    createdAt?: Date | string
  }

  export type GameScoreUpdateWithoutPlayerInput = {
    highScore?: IntFieldUpdateOperationsInput | number
    lastPlayedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type GameScoreUncheckedUpdateWithoutPlayerInput = {
    highScore?: IntFieldUpdateOperationsInput | number
    lastPlayedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type GameScoreUncheckedUpdateManyWithoutPlayerInput = {
    highScore?: IntFieldUpdateOperationsInput | number
    lastPlayedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TournamentWinnerUpdateWithoutPlayerInput = {
    id?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    tournament?: TournamentUpdateOneRequiredWithoutTournamentWinnerNestedInput
  }

  export type TournamentWinnerUncheckedUpdateWithoutPlayerInput = {
    id?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
    tournamentId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TournamentWinnerUncheckedUpdateManyWithoutPlayerInput = {
    id?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
    tournamentId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TournamentCreateManyGalleryInput = {
    id?: string
    name: string
    startDate: Date | string
    fee?: number | null
    seasonId?: string | null
    createdBy?: string | null
    createdAt?: Date | string
  }

  export type TournamentUpdateWithoutGalleryInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    fee?: NullableIntFieldUpdateOperationsInput | number | null
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    team?: TeamUpdateManyWithoutTournamentNestedInput
    user?: UserUpdateManyWithoutTournamentNestedInput
    season?: SeasonUpdateOneWithoutTournamentNestedInput
    tournamentWinner?: TournamentWinnerUpdateManyWithoutTournamentNestedInput
    pollVote?: PollVoteUpdateManyWithoutTournamentNestedInput
    match?: MatchUpdateManyWithoutTournamentNestedInput
  }

  export type TournamentUncheckedUpdateWithoutGalleryInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    fee?: NullableIntFieldUpdateOperationsInput | number | null
    seasonId?: NullableStringFieldUpdateOperationsInput | string | null
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    team?: TeamUncheckedUpdateManyWithoutTournamentNestedInput
    user?: UserUncheckedUpdateManyWithoutTournamentNestedInput
    tournamentWinner?: TournamentWinnerUncheckedUpdateManyWithoutTournamentNestedInput
    pollVote?: PollVoteUncheckedUpdateManyWithoutTournamentNestedInput
    match?: MatchUncheckedUpdateManyWithoutTournamentNestedInput
  }

  export type TournamentUncheckedUpdateManyWithoutGalleryInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    fee?: NullableIntFieldUpdateOperationsInput | number | null
    seasonId?: NullableStringFieldUpdateOperationsInput | string | null
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TournamentCreateManySeasonInput = {
    id?: string
    name: string
    startDate: Date | string
    fee?: number | null
    createdBy?: string | null
    createdAt?: Date | string
    galleryId?: string | null
  }

  export type TournamentUpdateWithoutSeasonInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    fee?: NullableIntFieldUpdateOperationsInput | number | null
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    team?: TeamUpdateManyWithoutTournamentNestedInput
    user?: UserUpdateManyWithoutTournamentNestedInput
    tournamentWinner?: TournamentWinnerUpdateManyWithoutTournamentNestedInput
    pollVote?: PollVoteUpdateManyWithoutTournamentNestedInput
    match?: MatchUpdateManyWithoutTournamentNestedInput
    gallery?: GalleryUpdateOneWithoutTournamentNestedInput
  }

  export type TournamentUncheckedUpdateWithoutSeasonInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    fee?: NullableIntFieldUpdateOperationsInput | number | null
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    galleryId?: NullableStringFieldUpdateOperationsInput | string | null
    team?: TeamUncheckedUpdateManyWithoutTournamentNestedInput
    user?: UserUncheckedUpdateManyWithoutTournamentNestedInput
    tournamentWinner?: TournamentWinnerUncheckedUpdateManyWithoutTournamentNestedInput
    pollVote?: PollVoteUncheckedUpdateManyWithoutTournamentNestedInput
    match?: MatchUncheckedUpdateManyWithoutTournamentNestedInput
  }

  export type TournamentUncheckedUpdateManyWithoutSeasonInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    fee?: NullableIntFieldUpdateOperationsInput | number | null
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    galleryId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type TeamCreateManyTournamentInput = {
    id?: string
    name: string
    createdAt?: Date | string
    teamNumber: number
    playerStatsId?: string | null
  }

  export type UserCreateManyTournamentInput = {
    id?: string
    email?: string | null
    clerkId: string
    isEmailLinked?: boolean
    userName: string
    usernameLastChangeAt?: Date | string
    role?: $Enums.Role
    balance?: number
    isInternal?: boolean
    isVerified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    playerId?: string | null
  }

  export type TournamentWinnerCreateManyTournamentInput = {
    id?: string
    playerId: string
    position: number
    createdAt?: Date | string
  }

  export type PollVoteCreateManyTournamentInput = {
    id?: string
    vote: $Enums.Vote
    inOption: string
    outOption: string
    soloOption: string
    startDate: Date | string
    endDate: Date | string
    playerId: string
    createdAt?: Date | string
  }

  export type MatchCreateManyTournamentInput = {
    id?: string
    matchName: string
    createdAt?: Date | string
  }

  export type TeamUpdateWithoutTournamentInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    teamNumber?: IntFieldUpdateOperationsInput | number
    playerStatsId?: NullableStringFieldUpdateOperationsInput | string | null
    players?: PlayerUpdateManyWithoutTeamNestedInput
  }

  export type TeamUncheckedUpdateWithoutTournamentInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    teamNumber?: IntFieldUpdateOperationsInput | number
    playerStatsId?: NullableStringFieldUpdateOperationsInput | string | null
    players?: PlayerUncheckedUpdateManyWithoutTeamNestedInput
  }

  export type TeamUncheckedUpdateManyWithoutTournamentInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    teamNumber?: IntFieldUpdateOperationsInput | number
    playerStatsId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type UserUpdateWithoutTournamentInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    clerkId?: StringFieldUpdateOperationsInput | string
    isEmailLinked?: BoolFieldUpdateOperationsInput | boolean
    userName?: StringFieldUpdateOperationsInput | string
    usernameLastChangeAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    balance?: IntFieldUpdateOperationsInput | number
    isInternal?: BoolFieldUpdateOperationsInput | boolean
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    playerId?: NullableStringFieldUpdateOperationsInput | string | null
    player?: PlayerUpdateOneWithoutUserNestedInput
    wallet?: WalletUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutTournamentInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    clerkId?: StringFieldUpdateOperationsInput | string
    isEmailLinked?: BoolFieldUpdateOperationsInput | boolean
    userName?: StringFieldUpdateOperationsInput | string
    usernameLastChangeAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    balance?: IntFieldUpdateOperationsInput | number
    isInternal?: BoolFieldUpdateOperationsInput | boolean
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    playerId?: NullableStringFieldUpdateOperationsInput | string | null
    player?: PlayerUncheckedUpdateOneWithoutUserNestedInput
    wallet?: WalletUncheckedUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateManyWithoutTournamentInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    clerkId?: StringFieldUpdateOperationsInput | string
    isEmailLinked?: BoolFieldUpdateOperationsInput | boolean
    userName?: StringFieldUpdateOperationsInput | string
    usernameLastChangeAt?: DateTimeFieldUpdateOperationsInput | Date | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    balance?: IntFieldUpdateOperationsInput | number
    isInternal?: BoolFieldUpdateOperationsInput | boolean
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    playerId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type TournamentWinnerUpdateWithoutTournamentInput = {
    id?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    player?: PlayerUpdateOneRequiredWithoutTournamentWinnerNestedInput
  }

  export type TournamentWinnerUncheckedUpdateWithoutTournamentInput = {
    id?: StringFieldUpdateOperationsInput | string
    playerId?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TournamentWinnerUncheckedUpdateManyWithoutTournamentInput = {
    id?: StringFieldUpdateOperationsInput | string
    playerId?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PollVoteUpdateWithoutTournamentInput = {
    id?: StringFieldUpdateOperationsInput | string
    vote?: EnumVoteFieldUpdateOperationsInput | $Enums.Vote
    inOption?: StringFieldUpdateOperationsInput | string
    outOption?: StringFieldUpdateOperationsInput | string
    soloOption?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    player?: PlayerUpdateOneRequiredWithoutPollVoteNestedInput
  }

  export type PollVoteUncheckedUpdateWithoutTournamentInput = {
    id?: StringFieldUpdateOperationsInput | string
    vote?: EnumVoteFieldUpdateOperationsInput | $Enums.Vote
    inOption?: StringFieldUpdateOperationsInput | string
    outOption?: StringFieldUpdateOperationsInput | string
    soloOption?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    playerId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PollVoteUncheckedUpdateManyWithoutTournamentInput = {
    id?: StringFieldUpdateOperationsInput | string
    vote?: EnumVoteFieldUpdateOperationsInput | $Enums.Vote
    inOption?: StringFieldUpdateOperationsInput | string
    outOption?: StringFieldUpdateOperationsInput | string
    soloOption?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    playerId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MatchUpdateWithoutTournamentInput = {
    id?: StringFieldUpdateOperationsInput | string
    matchName?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MatchUncheckedUpdateWithoutTournamentInput = {
    id?: StringFieldUpdateOperationsInput | string
    matchName?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MatchUncheckedUpdateManyWithoutTournamentInput = {
    id?: StringFieldUpdateOperationsInput | string
    matchName?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PlayerCreateManyTeamInput = {
    id?: string
    isBanned?: boolean
    category?: $Enums.PlayerCategory
    userId: string
    characterImageId?: string | null
  }

  export type PlayerUpdateWithoutTeamInput = {
    id?: StringFieldUpdateOperationsInput | string
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    category?: EnumPlayerCategoryFieldUpdateOperationsInput | $Enums.PlayerCategory
    gameScore?: GameScoreUpdateManyWithoutPlayerNestedInput
    pollVote?: PollVoteUpdateOneWithoutPlayerNestedInput
    user?: UserUpdateOneRequiredWithoutPlayerNestedInput
    tournamentWinner?: TournamentWinnerUpdateManyWithoutPlayerNestedInput
    Wallet?: WalletUpdateOneWithoutPlayerNestedInput
    playerStats?: PlayerStatsUpdateOneWithoutPlayerNestedInput
    characterImage?: GalleryUpdateOneWithoutPlayerNestedInput
  }

  export type PlayerUncheckedUpdateWithoutTeamInput = {
    id?: StringFieldUpdateOperationsInput | string
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    category?: EnumPlayerCategoryFieldUpdateOperationsInput | $Enums.PlayerCategory
    userId?: StringFieldUpdateOperationsInput | string
    characterImageId?: NullableStringFieldUpdateOperationsInput | string | null
    gameScore?: GameScoreUncheckedUpdateManyWithoutPlayerNestedInput
    pollVote?: PollVoteUncheckedUpdateOneWithoutPlayerNestedInput
    tournamentWinner?: TournamentWinnerUncheckedUpdateManyWithoutPlayerNestedInput
    Wallet?: WalletUncheckedUpdateOneWithoutPlayerNestedInput
    playerStats?: PlayerStatsUncheckedUpdateOneWithoutPlayerNestedInput
  }

  export type PlayerUncheckedUpdateManyWithoutTeamInput = {
    id?: StringFieldUpdateOperationsInput | string
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    category?: EnumPlayerCategoryFieldUpdateOperationsInput | $Enums.PlayerCategory
    userId?: StringFieldUpdateOperationsInput | string
    characterImageId?: NullableStringFieldUpdateOperationsInput | string | null
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}