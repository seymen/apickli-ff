Feature: set cookies

  Scenario: set a single cookie
    Given I set cookie to foo=bar
    And I set cookie to baz=foo
    When I GET /get
    Then response body path $.headers.Cookie should be foo=bar; baz=foo
