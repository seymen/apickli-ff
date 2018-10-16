Feature: Response body matching

  Scenario: should match content
    When I GET /html
    Then response body should contain patient hammer
    And response body should contain <!{1}.+html>
    And response body should not contain matrix
