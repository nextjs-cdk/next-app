// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

// Declare command definitions here so that autocomplete works
declare namespace Cypress {
  interface Chainable {
    ensureRouteCached: (path: string | RegExp, throwOnError?: boolean) => void;
    ensureRouteNotCached: (
      path: string | RegExp,
      throwOnError?: boolean,
    ) => void;
    ensureRouteNotErrored: (path: string | RegExp) => void;
    ensureAllRoutesNotErrored: () => void;
    ensureRouteHasStatusCode: (path: string | RegExp, status: number) => void;
    verifyRedirect: (
      path: string,
      redirectedPath: string,
      redirectStatusCode: number,
      headers?: { [key: string]: string },
    ) => void;
    verifyResponseCacheStatus: (
      response: Cypress.Response<any>,
      shouldBeCached: boolean,
    ) => void;
    verifyResponseIsCompressed: (response: Cypress.Response<any>) => void;
  }
}

Cypress.Commands.add('ensureAllRoutesNotErrored', () => {
  cy.intercept('**', (req) => {
    req.reply((res) => {
      if (res.statusCode >= 400) {
        throw new Error(`Response has errored with status ${res.statusCode}`);
      }
    });
  });
});

Cypress.Commands.add(
  'ensureRouteNotCached',
  (path: string | RegExp, throwOnError?: boolean) => {
    cy.intercept(path, (req) => {
      req.reply((res) => {
        if (throwOnError !== false && res.statusCode >= 400) {
          throw new Error(`Response has errored with status ${res.statusCode}`);
        }

        if (res.headers['x-vercel-cache'] === 'HIT') {
          throw new Error('Response was unexpectedly cached in CloudFront.');
        }
      });
    });
  },
);

Cypress.Commands.add(
  'ensureRouteCached',
  (path: string | RegExp, throwOnError?: boolean) => {
    cy.intercept(path, (req) => {
      req.reply((res) => {
        if (throwOnError !== false && res.statusCode >= 400) {
          throw new Error(`Response has errored with status ${res.statusCode}`);
        }

        if (res.headers['x-vercel-cache'] !== 'HIT') {
          throw new Error('Response was unexpectedly uncached in CloudFront.');
        }
      });
    });
  },
);

Cypress.Commands.add('ensureRouteNotErrored', (path: string | RegExp) => {
  cy.intercept(path, (req) => {
    req.reply((res) => {
      if (res.statusCode >= 400) {
        throw new Error(`Response has errored with status ${res.statusCode}`);
      }
    });
  });
});

Cypress.Commands.add(
  'ensureRouteHasStatusCode',
  (path: string | RegExp, status: number) => {
    cy.intercept(path, (req) => {
      req.reply((res) => {
        if (res.statusCode !== status) {
          throw new Error(
            `Page did not return expected status code of ${status}. Instead it returned ${res.statusCode}`,
          );
        }
      });
    });
  },
);

Cypress.Commands.add(
  'verifyRedirect',
  (
    path: string,
    redirectedPath: string,
    redirectStatusCode: number,
    headers?: { [key: string]: string },
  ) => {
    cy.request({ url: path, followRedirect: false, headers: headers }).then(
      (response) => {
        expect(response.status).to.equal(redirectStatusCode);
        expect(response.headers['location']).to.equal(redirectedPath);

        if (redirectStatusCode === 308) {
          // IE11 compatibility
          expect(response.headers['refresh']).to.equal(
            `0;url=${redirectedPath}`,
          );
        } else {
          expect(response.headers['refresh']).to.be.undefined;
        }

        expect(response.headers['cache-control']).to.equal(
          'public, max-age=0, must-revalidate',
        );
      },
    );
  },
);

Cypress.Commands.add(
  'verifyResponseCacheStatus',
  (response: Cypress.Response<any>, shouldBeCached: boolean) => {
    if (shouldBeCached) {
      expect(response.headers['x-vercel-cache']).to.equal('HIT');
    } else {
      expect(response.headers['x-vercel-cache']).to.be.oneOf([
        'MISS',
        'LambdaGeneratedResponse from cloudfront',
      ]);
    }
  },
);

Cypress.Commands.add(
  'verifyResponseIsCompressed',
  (response: Cypress.Response<any>) => {
    expect(response.headers['content-encoding']).to.equal('gzip');
  },
);
